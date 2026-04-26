import type { SniperMode } from '../lib/config';
import { cn } from '../lib/utils';

interface ModeSwitcherProps {
  mode: SniperMode;
  onModeChange: (mode: SniperMode) => void;
  disabled?: boolean;
}

export function ModeSwitcher({ mode, onModeChange, disabled }: ModeSwitcherProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        抢购模式
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => onModeChange('browser')}
          disabled={disabled}
          className={cn(
            'flex-1 relative px-4 py-3 rounded-md border text-sm font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            mode === 'browser'
              ? 'border-primary bg-primary/10 text-primary shadow-[var(--shadow-glow)]'
              : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2 justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>浏览器自动化</span>
          </div>
          <span className="block text-[10px] mt-0.5 opacity-60">Playwright 驱动</span>
        </button>

        <button
          onClick={() => onModeChange('api')}
          disabled={disabled}
          className={cn(
            'flex-1 relative px-4 py-3 rounded-md border text-sm font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            mode === 'api'
              ? 'border-primary bg-primary/10 text-primary shadow-[var(--shadow-glow)]'
              : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2 justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>API 高速模式</span>
          </div>
          <span className="block text-[10px] mt-0.5 opacity-60">直接调用接口</span>
        </button>
      </div>
    </div>
  );
}
