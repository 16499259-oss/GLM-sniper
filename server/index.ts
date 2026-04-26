import express, { Request, Response } from 'express';
import cors from 'cors';
import { chromium, Browser } from 'playwright';
import cookieParse from 'cookie-parse';

const app = express();
app.use(cors());
app.use(express.json());

// ===== API Proxy =====
// Proxy requests to bigmodel.cn to bypass CORS
app.use('/proxy', async (req: Request, res: Response) => {
  try {
    const targetUrl = `https://open.bigmodel.cn${req.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward auth header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization as string;
    }

    // Forward cookies
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie as string;
    }

    const resp = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await resp.text();
    res.status(resp.status).setHeader('Content-Type', 'application/json').send(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Browser Automation Sniper =====
app.post('/api/sniper/browser', async (req: Request, res: Response) => {
  const { plan, cookies, targetTime } = req.body;

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();

    // Set cookies if provided
    if (cookies) {
      const parsed = cookieParse.parse(cookies);
      const cookieObjects = Object.entries(parsed).map(([name, value]) => ({
        name,
        value: String(value),
        domain: '.bigmodel.cn',
        path: '/',
      }));
      await context.addCookies(cookieObjects);
    }

    const page = await context.newPage();

    // Navigate to GLM Coding page
    await page.goto('https://open.bigmodel.cn/glm-coding', { waitUntil: 'networkidle' });

    // Wait until target time if specified
    if (targetTime) {
      const target = new Date(targetTime);
      const delay = target.getTime() - Date.now();
      if (delay > 0) {
        console.log(`[Sniper] Waiting ${Math.ceil(delay / 1000)}s until target time...`);
        await page.waitForTimeout(delay - 2000); // Wake up 2s early
        // Refresh page to get latest state
        await page.reload({ waitUntil: 'networkidle' });
      }
    }

    // Click the target plan's subscribe button
    const planCards = page.locator('[class*="subscribe"], [class*="pricing"], [class*="plan"]');
    const planIndex = plan === 'lite' ? 0 : plan === 'pro' ? 1 : 2;

    // Try to find and click the subscribe button for the target plan
    // The page structure may vary, so we try multiple selectors
    const selectors = [
      `text=特惠订阅 >> nth=${planIndex}`,
      `button:has-text("特惠订阅") >> nth=${planIndex}`,
      `[class*="subscribe-btn"]:nth-child(${planIndex + 1})`,
    ];

    let clicked = false;
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          clicked = true;
          console.log(`[Sniper] Clicked subscribe button using selector: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!clicked) {
      // Fallback: click any visible subscribe button matching the plan
      const allButtons = page.locator('button:has-text("订阅")');
      const count = await allButtons.count();
      if (count > planIndex) {
        await allButtons.nth(planIndex).click();
        clicked = true;
      }
    }

    // Wait for payment page/modal to appear
    await page.waitForTimeout(3000);

    // Try to find and click payment confirmation
    const confirmSelectors = [
      'button:has-text("确认")',
      'button:has-text("支付")',
      'button:has-text("立即")',
      '[class*="pay"] button',
    ];

    for (const selector of confirmSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          console.log(`[Sniper] Clicked payment confirmation using: ${selector}`);
          break;
        }
      } catch {
        // Continue
      }
    }

    // Wait for payment to complete
    await page.waitForTimeout(5000);

    // Check if we're on a success page
    const pageContent = await page.content();
    const isSuccess = pageContent.includes('成功') || pageContent.includes('订阅');

    await browser.close();

    res.json({
      success: isSuccess,
      message: isSuccess ? 'Subscription successful!' : 'Payment may require manual completion',
      clicked,
    });
  } catch (err: any) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== Open Browser for Captcha Handling =====
// 打开浏览器窗口供用户手动处理验证码，不执行抢购操作
app.post('/api/sniper/open-browser', async (req: Request, res: Response) => {
  const { cookies, targetUrl = 'https://open.bigmodel.cn/glm-coding' } = req.body;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();

    // Set cookies if provided
    if (cookies) {
      const parsed = cookieParse.parse(cookies);
      const cookieObjects = Object.entries(parsed).map(([name, value]) => ({
        name,
        value: String(value),
        domain: '.bigmodel.cn',
        path: '/',
      }));
      await context.addCookies(cookieObjects);
    }

    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // 浏览器保持打开，等待用户手动处理验证码
    // 用户完成后需在前端点击"验证完成"按钮
    console.log('[Open Browser] Browser opened for captcha handling, waiting for user action...');

    // 不关闭浏览器，让用户可以操作
    // 浏览器会在一定时间后自动超时关闭，或者用户手动关闭
    // 设置30分钟后自动关闭作为安全措施
    setTimeout(async () => {
      try {
        if (browser) await browser.close();
        console.log('[Open Browser] Browser auto-closed after timeout');
      } catch {}
    }, 30 * 60 * 1000);

    res.json({
      success: true,
      message: '浏览器已打开，请完成验证码后点击"验证完成"按钮',
    });
  } catch (err: any) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== API Mode Sniper =====
app.post('/api/sniper/api', async (req: Request, res: Response) => {
  const { plan, authToken, targetTime, paymentType = 'alipay' } = req.body;

  const BASE = 'https://open.bigmodel.cn/api';
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Step 1: Check limit
    console.log('[API Sniper] Step 1: Checking limit buy status...');
    const limitResp = await fetch(`${BASE}/biz/product/isLimitBuy`, { headers });
    const limitData = await limitResp.json();
    console.log('[API Sniper] Limit check:', JSON.stringify(limitData));

    // Step 2: Create pre-order
    console.log('[API Sniper] Step 2: Creating pre-order...');
    const productIdMap: Record<string, string> = {
      'pro-quarterly': 'product-1df3e1',
      'pro-monthly': 'product-a6ef45',
      'pro-yearly': 'product-fc5155',
      'lite-quarterly': 'product-02434c',
      'max-quarterly': 'product-2fc421',
    };

    const productId = productIdMap[`${plan}-quarterly`] || productIdMap['pro-quarterly'];

    const preOrderResp = await fetch(`${BASE}/biz/product/createPreOrder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId, paymentType }),
    });

    if (!preOrderResp.ok) {
      const errText = await preOrderResp.text();
      return res.json({
        success: false,
        step: 'createPreOrder',
        status: preOrderResp.status,
        error: errText,
      });
    }

    const preOrderData = await preOrderResp.json();
    console.log('[API Sniper] Pre-order created:', JSON.stringify(preOrderData).slice(0, 300));

    // Step 3: Pay preview
    console.log('[API Sniper] Step 3: Getting pay preview...');
    const previewResp = await fetch(`${BASE}/biz/pay/preview`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId, paymentType }),
    });
    const previewData = await previewResp.json();

    // Step 4: Create sign
    console.log('[API Sniper] Step 4: Creating sign...');
    const signResp = await fetch(`${BASE}/biz/pay/create-sign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId, paymentType }),
    });

    const signData = await signResp.json();
    console.log('[API Sniper] Sign response:', JSON.stringify(signData).slice(0, 300));

    // Step 5: Check payment status
    let payStatus = null;
    if (signData.data?.key) {
      console.log('[API Sniper] Step 5: Checking payment status...');
      const statusResp = await fetch(`${BASE}/biz/pay/status?key=${signData.data.key}`, { headers });
      payStatus = await statusResp.json();
    }

    res.json({
      success: true,
      steps: {
        limitCheck: limitData,
        preOrder: preOrderData,
        preview: previewData,
        sign: signData,
        payStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== Stock Status Check =====
app.get('/api/stock/status', async (req: Request, res: Response) => {
  try {
    // 查询库存状态
    const stockUrl = 'https://open.bigmodel.cn/api/biz/operation/query?ids=1111';

    const resp = await fetch(stockUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `HTTP ${resp.status}` });
    }

    const data = await resp.json();

    // 解析库存状态 - 默认为已售罄（因为限售）
    const stockStatus = {
      lite: { available: false, message: '已售罄' },
      pro: { available: false, message: '已售罄' },
      max: { available: false, message: '已售罄' },
      nextRelease: '每日 10:00 补货' as string | null,
    };

    // 尝试从返回数据中解析库存状态
    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item?.operationId === '1111' || item?.id === 1111) {
          const content = item?.content;
          if (typeof content === 'string') {
            try {
              const parsedContent = JSON.parse(content);
              // 检查库存状态字段
              if (parsedContent.stockStatus || parsedContent.liteStock || parsedContent.proStock) {
                if (parsedContent.liteStock) {
                  stockStatus.lite = {
                    available: parsedContent.liteStock !== 'sold_out',
                    message: parsedContent.liteStock === 'sold_out' ? '已售罄' : '有库存',
                  };
                }
                if (parsedContent.proStock) {
                  stockStatus.pro = {
                    available: parsedContent.proStock !== 'sold_out',
                    message: parsedContent.proStock === 'sold_out' ? '已售罄' : '有库存',
                  };
                }
                if (parsedContent.maxStock) {
                  stockStatus.max = {
                    available: parsedContent.maxStock !== 'sold_out',
                    message: parsedContent.maxStock === 'sold_out' ? '已售罄' : '有库存',
                  };
                }
                if (parsedContent.nextReleaseTime || parsedContent.replenishTime) {
                  stockStatus.nextRelease = parsedContent.nextReleaseTime || parsedContent.replenishTime;
                }
              }
            } catch {
              // 解析失败，使用默认值
            }
          } else if (content && typeof content === 'object') {
            // content 已经是对象
            if (content.liteStock || content.proStock || content.maxStock) {
              stockStatus.lite = content.liteStock ? {
                available: content.liteStock !== 'sold_out',
                message: content.liteStock === 'sold_out' ? '已售罄' : '有库存',
              } : stockStatus.lite;
              stockStatus.pro = content.proStock ? {
                available: content.proStock !== 'sold_out',
                message: content.proStock === 'sold_out' ? '已售罄' : '有库存',
              } : stockStatus.pro;
              stockStatus.max = content.maxStock ? {
                available: content.maxStock !== 'sold_out',
                message: content.maxStock === 'sold_out' ? '已售罄' : '有库存',
              } : stockStatus.max;
            }
          }
        }
      }
    }

    // 添加当前时间判断 - 在10:00前后自动判断
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    // 如果在 9:59-10:01 之间，提示可能即将补货
    if (hour === 9 && minute >= 55) {
      stockStatus.nextRelease = '即将补货（约 10:00）';
    } else if (hour === 10 && minute <= 5) {
      // 在补货窗口期内，标记为"检查中"
      stockStatus.lite.message = '检查中...';
      stockStatus.pro.message = '检查中...';
      stockStatus.max.message = '检查中...';
    }

    res.json({
      success: true,
      raw: data,
      parsed: stockStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (_: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT || '3100', 10);
app.listen(PORT, () => {
  console.log(`🎯 GLM Sniper Server running on http://localhost:${PORT}`);
  console.log(`📡 API Proxy: http://localhost:${PORT}/proxy/...`);
  console.log(`📊 Stock Status: http://localhost:${PORT}/api/stock/status`);
  console.log(`🤖 Browser Sniper: POST http://localhost:${PORT}/api/sniper/browser`);
  console.log(`⚡ API Sniper: POST http://localhost:${PORT}/api/sniper/api`);
});
