import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  SniperMode,
  PlanType,
  PaymentCycle,
  SniperStatus,
  LogEntry,
} from '../lib/config';
import { PLANS, getProductId, calculatePrice, formatPrice, DEFAULT_CYCLE, API_BASE_URL } from '../lib/config';
import { createLog, getTargetDateTime } from '../lib/utils';

// 库存状态接口
interface StockStatus {
  lite: { available: boolean; message: string };
  pro: { available: boolean; message: string };
  max: { available: boolean; message: string };
  nextRelease: string | null;
}

interface UseSniperReturn {
  mode: SniperMode;
  setMode: (m: SniperMode) => void;
  plan: PlanType;
  setPlan: (p: PlanType) => void;
  paymentCycle: PaymentCycle;
  setPaymentCycle: (c: PaymentCycle) => void;
  targetDate: string;
  setTargetDate: (d: string) => void;
  targetTime: string;
  setTargetTime: (t: string) => void;
  authToken: string;
  setAuthToken: (t: string) => void;
  cookies: string;
  setCookies: (c: string) => void;
  status: SniperStatus;
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  start: () => void;
  stop: () => void;
  // 验证码处理相关
  resumeAfterCaptcha: () => void;
  // 库存监控相关
  stockStatus: StockStatus | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkStock: () => Promise<void>;
}

export function useSniper(): UseSniperReturn {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [mode, setMode] = useState<SniperMode>('api');
  const [plan, setPlan] = useState<PlanType>('pro');
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>(DEFAULT_CYCLE);
  const [targetDate, setTargetDate] = useState(tomorrowStr);
  const [targetTime, setTargetTime] = useState('10:00');
  const [authToken, setAuthToken] = useState('');
  const [cookies, setCookies] = useState('');
  const [status, setStatus] = useState<SniperStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stockStatus, setStockStatus] = useState<StockStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monitoringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const abortedRef = useRef(false);
  const monitoringAbortedRef = useRef(false);

  const addLog = useCallback((log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Browser automation mode - send command to backend
  const executeBrowserSniper = useCallback(async () => {
    addLog(createLog('info', `[浏览器模式] 启动 Playwright 自动化...`));
    addLog(createLog('info', `[浏览器模式] 目标: ${PLANS[plan].name} 套餐`));

    try {
      const resp = await fetch(`${API_BASE_URL}/api/sniper/browser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          cookies,
          targetTime: `${targetDate}T${targetTime}:00`,
        }),
      });

      const data = await resp.json();

      if (data.success) {
        addLog(createLog('success', `[浏览器模式] 抢购成功！订单号: ${data.orderId || '未知'}`));
        setStatus('success');
      } else {
        addLog(createLog('error', `[浏览器模式] 抢购失败: ${data.message || '未知错误'}`));
        setStatus('error');
      }
    } catch (err: any) {
      addLog(createLog('error', `[浏览器模式] 连接后端失败: ${err.message}`));
      addLog(createLog('warning', `请确保后端服务已启动 (npm run server)`));
      setStatus('error');
    }
  }, [plan, cookies, targetDate, targetTime, addLog]);

  const PROXY_BASE = `${API_BASE_URL}/proxy/api`;

  // API mode - direct HTTP requests via proxy to bypass CORS
  const executeApiSniper = useCallback(async () => {
    addLog(createLog('info', `[API模式] 开始执行抢购流程...`));
    addLog(createLog('info', `[API模式] 目标: ${PLANS[plan].name} 套餐`));

    // 检查认证：Token 或 Cookies 必须有一个
    if (!authToken && !cookies) {
      addLog(createLog('error', `[API模式] 缺少认证，请先配置 Token 或 Cookies`));
      setStatus('error');
      return;
    }

    // 构建请求头：优先级：Token > Cookies
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      addLog(createLog('info', '[认证方式] Bearer Token'));
    } else if (cookies) {
      headers['Cookie'] = cookies;
      addLog(createLog('info', '[认证方式] Cookies'));
    }

    try {
      // Step 1: Check if limited
      addLog(createLog('info', `[步骤1] 检查库存状态...`));
      const limitResp = await fetch(`${PROXY_BASE}/biz/product/isLimitBuy`, { headers });

      if (limitResp.ok) {
        const limitData = await limitResp.json();
        addLog(createLog('info', `[步骤1] 库存检查结果: ${JSON.stringify(limitData)}`));
      } else {
        addLog(createLog('warning', `[步骤1] 库存检查请求失败: HTTP ${limitResp.status}`));
      }

      // Step 2: Create pre-order
      addLog(createLog('info', '[步骤2] 创建预订单...'));
      const productId = getProductId(plan, paymentCycle);
      const payPrice = calculatePrice(plan, paymentCycle) * 100; // 转换为分
      const cycleNames = { monthly: '连续包月', quarterly: '连续包季', yearly: '连续包年' };
      addLog(createLog('info', `[步骤2] 产品ID: ${productId} (${PLANS[plan].name} ${cycleNames[paymentCycle]})`));
      addLog(createLog('info', `[步骤2] 支付金额: ${formatPrice(payPrice / 100)}元 (${payPrice}分)`));

      const preOrderResp = await fetch(`${PROXY_BASE}/biz/product/createPreOrder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId,
          paymentType: 'alipay',
          num: 1,            // 购买数量
          isMobile: false,   // 是否为手机端
          payPrice: payPrice, // 支付金额（分）
          channelCode: 'ALIPAY_WEB', // 支付渠道编码
        }),
      });

      const preOrderData = await preOrderResp.json();
      addLog(createLog('info', `[步骤2] 预订单响应: ${JSON.stringify(preOrderData)}`));

      // 检查业务层面的成功（code=200 或 success=true）
      if (!preOrderResp.ok || preOrderData.code !== 200 || !preOrderData.success) {
        const errorMsg = preOrderData.msg || `HTTP ${preOrderResp.status}`;
        addLog(createLog('error', `[步骤2] 创建预订单失败: ${errorMsg}`));

        // 检测验证码相关错误
        if (errorMsg.includes('captcha') || errorMsg.includes('验证') ||
            errorMsg.includes('verify') || errorMsg.includes('Tencent') ||
            errorMsg.includes('安全验证') || errorMsg.includes('security') ||
            preOrderResp.status === 403) {
          addLog(createLog('warning', '⚠️ 检测到验证码拦截！'));
          addLog(createLog('info', '正在打开浏览器窗口供您处理验证码...'));
          
          // 自动打开浏览器窗口
          try {
            const browserResp = await fetch(`${API_BASE_URL}/api/sniper/open-browser`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cookies }),
            });
            
            if (browserResp.ok) {
              addLog(createLog('success', '✅ 浏览器已打开！请在浏览器中完成拼图验证'));
              addLog(createLog('info', '💡 完成验证码后，点击下方【验证完成，继续抢购】按钮'));
              setStatus('captcha_pending');
            } else {
              addLog(createLog('error', '打开浏览器失败，请手动前往官网处理验证码'));
              addLog(createLog('info', 'https://open.bigmodel.cn/glm-coding'));
              setStatus('error');
            }
          } catch (browserErr: any) {
            addLog(createLog('error', `打开浏览器失败: ${browserErr.message}`));
            addLog(createLog('warning', '请手动前往官网: https://open.bigmodel.cn/glm-coding'));
            setStatus('error');
          }
          return;
        }

        retryCountRef.current++;
        // 持续重试直到成功或手动停止
        if (!abortedRef.current) {
          addLog(createLog('warning', `[重试] 第 ${retryCountRef.current} 次重试，间隔 2 秒...`));
          setTimeout(() => executeApiSniper(), 2000);
          return;
        }
        setStatus('error');
        return;
      }

      addLog(createLog('success', '[步骤2] 预订单创建成功!'));
      addLog(createLog('info', `[步骤2] 订单数据: ${JSON.stringify(preOrderData).slice(0, 300)}`));

      // Step 3: Pay preview
      addLog(createLog('info', `[步骤3] 获取支付预览...`));
      const payPreviewResp = await fetch(`${PROXY_BASE}/biz/pay/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, paymentType: 'alipay' }),
      });

      if (payPreviewResp.ok) {
        const previewData = await payPreviewResp.json();
        addLog(createLog('success', `[步骤3] 支付预览获取成功`));
        addLog(createLog('info', `[步骤3] 预览数据: ${JSON.stringify(previewData).slice(0, 300)}`));
      } else {
        addLog(createLog('warning', `[步骤3] 支付预览获取失败，继续下一步...`));
      }

      // Step 4: Create sign (confirm subscription)
      addLog(createLog('info', `[步骤4] 确认签约订阅...`));
      const createSignResp = await fetch(`${PROXY_BASE}/biz/pay/create-sign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, paymentType: 'alipay' }),
      });

      if (createSignResp.ok) {
        const signData = await createSignResp.json();
        addLog(createLog('success', `[步骤4] 签约请求已发送!`));
        addLog(createLog('info', `[步骤4] 签约数据: ${JSON.stringify(signData).slice(0, 300)}`));

        // Check payment status
        if (signData.data?.key || signData.data?.payOrderNo) {
          addLog(createLog('info', `[步骤5] 检查支付状态...`));
          const checkKey = signData.data.key || signData.data.payOrderNo;

          const statusResp = await fetch(
            `${PROXY_BASE}/biz/pay/status?key=${checkKey}`,
            { headers }
          );

          if (statusResp.ok) {
            const statusData = await statusResp.json();
            addLog(createLog('info', `[步骤5] 支付状态: ${JSON.stringify(statusData).slice(0, 200)}`));

            if (statusData.data?.status === 'SUCCESS' || statusData.data?.tradeStatus === 'SUCCESS') {
              addLog(createLog('success', `🎉 抢购成功！GLM Coding Plan ${PLANS[plan].name} 已订阅！`));
              setStatus('success');
              return;
            }
          }
        }

        addLog(createLog('warning', `支付可能需要人工完成，请检查智谱AI平台确认订阅状态`));
        setStatus('success');
      } else {
        const errorText = await createSignResp.text();
        addLog(createLog('error', `[步骤4] 签约失败: HTTP ${createSignResp.status}`));
        addLog(createLog('error', `[步骤4] 响应: ${errorText.slice(0, 200)}`));
        setStatus('error');
      }

    } catch (err: any) {
      addLog(createLog('error', `[API模式] 请求异常: ${err.message}`));
      addLog(createLog('warning', `请确保后端服务已启动: npm run server`));
      setStatus('error');
    }
  }, [plan, authToken, addLog]);

  // Main start function
  const start = useCallback(() => {
    abortedRef.current = false;
    retryCountRef.current = 0;
    clearLogs();

    addLog(createLog('info', '═══════════════════════════════════════'));
    addLog(createLog('info', '  GLM Coding Plan Sniper 启动'));
    addLog(createLog('info', `  模式: ${mode === 'browser' ? '浏览器自动化' : 'API 高速'}`));
        const cycleNames = { monthly: '连续包月', quarterly: '连续包季', yearly: '连续包年' };
        addLog(createLog('info', `  套餐: ${PLANS[plan].name} ${cycleNames[paymentCycle]} (${formatPrice(calculatePrice(plan, paymentCycle))})`));
    addLog(createLog('info', `  目标时间: ${targetDate} ${targetTime}`));
    addLog(createLog('info', '═══════════════════════════════════════'));

    const target = getTargetDateTime(targetDate, targetTime);
    const now = Date.now();
    const delay = target.getTime() - now;

    if (delay > 0) {
      addLog(createLog('info', `倒计时 ${Math.ceil(delay / 1000)} 秒后开始抢购...`));
      setStatus('countdown');

      // Start countdown - execute 5 seconds early to compensate for network latency
      const executeDelay = Math.max(0, delay - 5000);
      timerRef.current = setTimeout(() => {
        if (!abortedRef.current) {
          addLog(createLog('warning', '⏰ 提前 5 秒发起请求（补偿网络延迟）...'));
          setStatus('running');
          if (mode === 'browser') {
            executeBrowserSniper();
          } else {
            executeApiSniper();
          }
        }
      }, executeDelay);
    } else {
      addLog(createLog('warning', '目标时间已过，立即开始抢购...'));
      setStatus('running');
      if (mode === 'browser') {
        executeBrowserSniper();
      } else {
        executeApiSniper();
      }
    }
  }, [mode, plan, targetDate, targetTime, executeBrowserSniper, executeApiSniper, addLog, clearLogs]);

  const stop = useCallback(() => {
    abortedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    addLog(createLog('warning', '⛔ 抢购已手动停止'));
    setStatus('idle');
  }, [addLog]);

  // ===== 库存监控功能 =====

  // 停止库存监控 - 提前定义避免循环依赖
  const stopMonitoring = useCallback(() => {
    monitoringAbortedRef.current = true;
    setIsMonitoring(false);
    if (monitoringTimerRef.current) {
      clearTimeout(monitoringTimerRef.current);
      monitoringTimerRef.current = null;
    }
    addLog(createLog('warning', '⛔ 库存监控已停止'));
  }, [addLog]);

  // 检查库存状态
  const checkStock = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/stock/status`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.parsed) {
          setStockStatus(data.parsed);

          // 检查目标套餐是否有库存
          const planStock = data.parsed[plan];
          if (planStock?.available) {
            addLog(createLog('success', `📦 ${PLANS[plan].name} 套餐有库存！准备抢购...`));
            // 自动触发抢购
            if (isMonitoring && authToken) {
              stopMonitoring();
              setStatus('running');
              executeApiSniper();
            }
          } else {
            addLog(createLog('info', `📊 ${PLANS[plan].name}: ${planStock?.message || '无库存'}`));
          }

          // 显示下次补货时间
          if (data.parsed.nextRelease) {
            addLog(createLog('info', `⏰ 下次补货时间: ${data.parsed.nextRelease}`));
          }
        }
      } else {
        addLog(createLog('warning', `库存检查失败: HTTP ${resp.status}`));
      }
    } catch (err: any) {
      addLog(createLog('error', `库存检查异常: ${err.message}`));
    }
  }, [plan, isMonitoring, authToken, addLog, executeApiSniper, stopMonitoring]);

  // 启动库存监控
  const startMonitoring = useCallback(() => {
    monitoringAbortedRef.current = false;
    setIsMonitoring(true);
    addLog(createLog('info', '🔍 启动库存监控...'));
    addLog(createLog('info', '每 5 秒检查一次库存状态'));

    // 立即检查一次
    checkStock();

    // 定时轮询（5秒间隔）
    const pollStock = () => {
      if (!monitoringAbortedRef.current) {
        checkStock();
        monitoringTimerRef.current = setTimeout(pollStock, 5000);
      }
    };
    monitoringTimerRef.current = setTimeout(pollStock, 5000);
  }, [checkStock, addLog]);

  // 验证码处理完成后恢复API抢购
  const resumeAfterCaptcha = useCallback(() => {
    addLog(createLog('info', '🔄 验证码处理完成，重新开始API抢购...'));
    addLog(createLog('info', '⏳ 重试次数将重置为0'));
    
    // 重置重试次数
    retryCountRef.current = 0;
    abortedRef.current = false;
    
    // 设置状态为运行中
    setStatus('running');
    
    // 重新执行API抢购
    executeApiSniper();
  }, [addLog, executeApiSniper]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (monitoringTimerRef.current) {
        clearTimeout(monitoringTimerRef.current);
      }
    };
  }, []);

  return {
    mode, setMode,
    plan, setPlan,
    paymentCycle, setPaymentCycle,
    targetDate, setTargetDate,
    targetTime, setTargetTime,
    authToken, setAuthToken,
    cookies, setCookies,
    status,
    logs,
    addLog,
    clearLogs,
    start,
    stop,
    // 验证码处理
    resumeAfterCaptcha,
    // 库存监控
    stockStatus,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    checkStock,
  };
}
