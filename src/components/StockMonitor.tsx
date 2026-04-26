import { cn } from '../lib/utils';
import { PLANS } from '../lib/config';
import type { PlanType } from '../lib/config';

interface StockItem {
  available: boolean;
  message: string;
}

interface StockStatus {
  lite: StockItem;
  pro: StockItem;
  max: StockItem;
  nextRelease: string | null;
}

interface StockMonitorProps {
  stockStatus: StockStatus | null;
  isMonitoring: boolean;
  plan: PlanType;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  onCheckStock: () => void;
  disabled?: boolean;
}

export function StockMonitor({
  stockStatus,
  isMonitoring,
  plan,
  onStartMonitoring,
  onStopMonitoring,
  onCheckStock,
  disabled,
}: StockMonitorProps) {
  const planTypes: PlanType[] = ['lite', 'pro', 'max'];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          库存监控
        </label>
        <div className="flex items-center gap-1.5">
          {isMonitoring && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {isMonitoring ? '监控中' : '待命'}
          </span>
        </div>
      </div>

      {/* 套餐库存状态 */}
      <div className="grid grid-cols-3 gap-2">
        {planTypes.map((p) => (
          <div
            key={p}
            className={cn(
              'p-2 rounded-md border transition-all',
              p === plan ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/30',
              stockStatus?.[p]?.available ? 'border-green-500/50 bg-green-500/10' : ''
            )}
          >
            <div className="text-[10px] text-muted-foreground mb-1">
              {PLANS[p].name}
            </div>
            <div className={cn(
              'text-xs font-medium',
              stockStatus?.[p]?.available ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {stockStatus?.[p]?.message || '未查询'}
            </div>
          </div>
        ))}
      </div>

      {/* 下次补货时间 */}
      {stockStatus?.nextRelease && (
        <div className="px-2 py-1.5 rounded-md bg-accent/10 border border-accent/20">
          <div className="text-[10px] text-accent">
            ⏰ 下次补货: {stockStatus.nextRelease}
          </div>
        </div>
      )}

      {/* 监控控制按钮 */}
      <div className="flex gap-2">
        <button
          onClick={onCheckStock}
          disabled={disabled || isMonitoring}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
            'border border-border bg-secondary/50 text-secondary-foreground',
            'hover:bg-secondary hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          手动查询
        </button>

        {isMonitoring ? (
          <button
            onClick={onStopMonitoring}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              'border border-warning/50 bg-warning/10 text-warning',
              'hover:bg-warning/20',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            停止监控
          </button>
        ) : (
          <button
            onClick={onStartMonitoring}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              'border border-primary/50 bg-primary/10 text-primary',
              'hover:bg-primary/20',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            启动监控
          </button>
        )}
      </div>

      {/* 说明 */}
      <div className="text-[10px] text-muted-foreground/60">
        启动监控后会每 5 秒自动检查库存，当目标套餐有库存时自动触发抢购
      </div>
    </div>
  );
}