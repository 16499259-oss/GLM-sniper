import { useState, useEffect } from 'react';
import { formatCountdown, getTargetDateTime } from '../lib/utils';
import { cn } from '../lib/utils';

interface TimerConfigProps {
  targetDate: string;
  targetTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

export function TimerConfig({ targetDate, targetTime, onDateChange, onTimeChange, disabled }: TimerConfigProps) {
  const [countdown, setCountdown] = useState<string>('--:--:--');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const target = getTargetDateTime(targetDate, targetTime);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('00:00:00');
        setIsPast(true);
      } else {
        setCountdown(formatCountdown(diff));
        setIsPast(false);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        定时抢购
      </label>

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            min={minDate}
            max={maxDateStr}
            className="w-full px-3 py-2 rounded-md border border-border bg-secondary/50 text-sm text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              [color-scheme:dark]"
          />
        </div>
        <div className="w-32">
          <input
            type="time"
            value={targetTime}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-md border border-border bg-secondary/50 text-sm text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              [color-scheme:dark]"
          />
        </div>
      </div>

      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border',
        isPast
          ? 'border-error/30 bg-error/5'
          : 'border-primary/20 bg-primary/5'
      )}>
        <svg className={cn('w-4 h-4', isPast ? 'text-error' : 'text-primary')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={cn(
          'font-mono text-lg font-bold tracking-wider',
          isPast ? 'text-error' : 'text-primary'
        )}>
          {countdown}
        </span>
        <span className="text-xs text-muted-foreground">
          {isPast ? '已过目标时间' : '后开始抢购'}
        </span>
      </div>
    </div>
  );
}
