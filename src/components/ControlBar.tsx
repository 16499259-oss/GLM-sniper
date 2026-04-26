import type { SniperStatus } from '../lib/config';
import { cn } from '../lib/utils';

interface ControlBarProps {
  status: SniperStatus;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function ControlBar({ status, onStart, onStop, disabled }: ControlBarProps) {
  const isRunning = status === 'running' || status === 'countdown';
  const isSuccess = status === 'success';

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          status === 'idle' && 'status-dot-idle',
          isRunning && 'status-dot-running',
          isSuccess && 'bg-success shadow-[0_0_8px_hsl(var(--success))]',
          status === 'error' && 'status-dot-error',
        )} />
        <span className={cn(
          'text-xs font-medium uppercase tracking-wider',
          status === 'idle' && 'text-muted-foreground',
          isRunning && 'text-primary',
          isSuccess && 'text-success',
          status === 'error' && 'text-error',
        )}>
          {status === 'idle' && '就绪'}
          {status === 'countdown' && '倒计时中'}
          {status === 'running' && '抢购中'}
          {isSuccess && '抢购成功'}
          {status === 'error' && '出错'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Stop button */}
      {isRunning && (
        <button
          onClick={onStop}
          className="px-4 py-2 rounded-md border border-error/50 bg-error/10 text-error text-sm font-medium
            hover:bg-error/20 hover:border-error transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-error/50"
        >
          停止
        </button>
      )}

      {/* Start button */}
      {!isRunning && (
        <button
          onClick={onStart}
          disabled={disabled || isSuccess}
          className={cn(
            'px-6 py-2.5 rounded-md text-sm font-semibold transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            isSuccess
              ? 'border border-success/50 bg-success/10 text-success cursor-default'
              : disabled
                ? 'border border-border bg-secondary text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary-glow shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] active:scale-[0.98]'
          )}
        >
          {isSuccess ? '✓ 已完成' : '启动抢购'}
        </button>
      )}
    </div>
  );
}
