import { useEffect, useRef } from 'react';
import type { LogEntry } from '../lib/config';
import { formatTime } from '../lib/utils';

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

const LEVEL_LABELS: Record<string, string> = {
  info: 'INFO',
  success: ' OK ',
  warning: 'WARN',
  error: 'FAIL',
};

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          实时日志
        </label>
        <button
          onClick={onClear}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-transparent hover:border-border"
        >
          清空
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-[240px] max-h-[400px] overflow-y-auto custom-scrollbar rounded-md border border-border bg-[hsl(224,20%,4%)] p-3 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground/40 text-center py-8">
            等待指令...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 leading-relaxed animate-slide-in">
              <span className="text-muted-foreground/50 shrink-0">
                [{formatTime(log.timestamp)}]
              </span>
              <span className={`shrink-0 font-bold ${
                log.level === 'info' ? 'text-info' :
                log.level === 'success' ? 'text-success' :
                log.level === 'warning' ? 'text-warning' :
                'text-error'
              }`}>
                [{LEVEL_LABELS[log.level]}]
              </span>
              <span className={
                log.level === 'info' ? 'text-foreground/80' :
                log.level === 'success' ? 'text-success' :
                log.level === 'warning' ? 'text-warning' :
                'text-error'
              }>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div className="inline-block w-2 h-3.5 bg-primary/70 animate-blink ml-1" />
      </div>
    </div>
  );
}
