import type { SniperMode, PlanType } from '../lib/config';

interface QuickGuideProps {
  mode: SniperMode;
  plan: PlanType;
}

export function QuickGuide({ mode, plan }: QuickGuideProps) {
  const planName = plan === 'lite' ? 'Lite' : plan === 'pro' ? 'Pro' : 'Max';

  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium text-foreground">
          {mode === 'browser' ? '浏览器自动化' : 'API 高速模式'} 使用指南
        </span>
      </div>

      {mode === 'browser' ? (
        <ol className="text-[11px] text-muted-foreground space-y-1 ml-6 list-decimal">
          <li>在浏览器中登录 <span className="text-info">open.bigmodel.cn</span></li>
          <li>打开 DevTools → Application → Cookies，复制所有 cookies</li>
          <li>粘贴到左侧 Cookies 输入框</li>
          <li>设置目标时间为每日 <span className="text-warning">10:00</span></li>
          <li>点击启动抢购，工具将在目标时间自动点击订阅按钮</li>
        </ol>
      ) : (
        <ol className="text-[11px] text-muted-foreground space-y-1 ml-6 list-decimal">
          <li>在浏览器中登录 <span className="text-info">open.bigmodel.cn</span></li>
          <li>打开 DevTools → Network，找到任意 API 请求的 Authorization 头</li>
          <li>复制 Bearer Token 粘贴到左侧 Token 输入框</li>
          <li>选择目标套餐：<span className="text-primary">{planName}</span></li>
          <li>设置目标时间为每日 <span className="text-warning">10:00</span></li>
          <li>点击启动抢购，工具将在目标时间直接调用 API 下单</li>
        </ol>
      )}

      <div className="mt-2 pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60">
          ⚠ 注意：网站有腾讯验证码+数美验证码双重防护，遇到验证码时：
        </p>
        <ul className="text-[10px] text-muted-foreground/60 mt-1 ml-4 list-disc">
          <li>API模式：需要手动在官网完成验证后重试</li>
          <li>浏览器模式：弹窗会暂停，请手动完成拼图验证</li>
        </ul>
        <p className="text-[10px] text-warning/80 mt-1">
          💡 建议：提前 5 分钟启动，保持浏览器窗口可见以便处理验证码
        </p>
      </div>
    </div>
  );
}
