import { useState } from 'react';
import { cn, createLog } from '../lib/utils';
import { API_BASE_URL } from '../lib/config';
import type { LogEntry } from '../lib/config';

interface AuthPanelProps {
  authToken: string;
  onTokenChange: (token: string) => void;
  cookies: string;
  onCookiesChange: (cookies: string) => void;
  disabled?: boolean;
  onLog: (log: LogEntry) => void;
}

export function AuthPanel({ authToken, onTokenChange, cookies, onCookiesChange, disabled, onLog }: AuthPanelProps) {
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    onLog(createLog('info', '正在验证认证信息...'));

    try {
      const resp = await fetch(`${API_BASE_URL}/proxy/api/biz/subscription/list`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        onLog(createLog('success', `认证有效 - 用户: ${data.data?.customerName || '未知'}`));
      } else {
        onLog(createLog('error', `认证失效 - HTTP ${resp.status}`));
      }
    } catch (err) {
      onLog(createLog('warning', '无法验证认证（可能需要配置代理）'));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        认证管理
      </label>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary-foreground shrink-0 w-16">Token</span>
          <div className="flex-1 relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={authToken}
              onChange={(e) => onTokenChange(e.target.value)}
              disabled={disabled}
              placeholder="粘贴你的认证 Token..."
              className="w-full px-3 py-2 pr-9 rounded-md border border-border bg-secondary/50 text-xs text-foreground font-mono
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
                placeholder:text-muted-foreground/50
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showToken ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary-foreground shrink-0 w-16">Cookies</span>
          <textarea
            value={cookies}
            onChange={(e) => onCookiesChange(e.target.value)}
            disabled={disabled}
            placeholder="从浏览器复制的 Cookies（可选，浏览器模式需要）..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-md border border-border bg-secondary/50 text-xs text-foreground font-mono resize-none
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
              placeholder:text-muted-foreground/50
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleValidate}
            disabled={disabled || !authToken || isValidating}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              'border border-border bg-secondary/50 text-secondary-foreground',
              'hover:bg-secondary hover:text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isValidating ? '验证中...' : '验证 Token'}
          </button>
          <span className="text-[10px] text-muted-foreground self-center">
            从浏览器 DevTools → Network → 请求头中获取 Authorization
          </span>
        </div>
      </div>
    </div>
  );
}
