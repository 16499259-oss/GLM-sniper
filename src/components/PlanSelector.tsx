import type { PlanType, PaymentCycle } from '../lib/config';
import { PLANS, PAYMENT_CYCLES, calculatePrice, formatPrice } from '../lib/config';
import { cn } from '../lib/utils';

interface PlanSelectorProps {
  plan: PlanType;
  onPlanChange: (plan: PlanType) => void;
  paymentCycle: PaymentCycle;
  onPaymentCycleChange: (cycle: PaymentCycle) => void;
  disabled?: boolean;
}

export function PlanSelector({ plan, onPlanChange, paymentCycle, onPaymentCycleChange, disabled }: PlanSelectorProps) {
  const plans: PlanType[] = ['lite', 'pro', 'max'];
  const cycles: PaymentCycle[] = ['monthly', 'quarterly', 'yearly'];

  return (
    <div className="flex flex-col gap-3">
      {/* 套餐选择 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          目标套餐
        </label>
      <div className="flex gap-2">
        {plans.map((p) => {
          const config = PLANS[p];
          const isSelected = plan === p;
          return (
            <button
              key={p}
              onClick={() => onPlanChange(p)}
              disabled={disabled}
              className={cn(
                'flex-1 relative px-3 py-3 rounded-md border text-left transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-[var(--shadow-glow)]'
                  : 'border-border bg-secondary/50 hover:border-primary/30',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {config.badge && (
                <span className="absolute -top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  {config.badge}
                </span>
              )}
              <div className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {config.name}
              </div>
              <div className={cn(
                'text-xs mt-0.5',
                isSelected ? 'text-primary/70' : 'text-muted-foreground'
              )}>
                月价 ¥{config.monthlyPrice}
              </div>
            </button>
          );
        })}
      </div>
      </div>

      {/* 支付周期选择 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          支付周期
        </label>
        <div className="flex gap-2">
          {cycles.map((c) => {
            const cycleConfig = PAYMENT_CYCLES[c];
            const price = calculatePrice(plan, c);
            const isSelected = paymentCycle === c;
            return (
              <button
                key={c}
                onClick={() => onPaymentCycleChange(c)}
                disabled={disabled}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md border text-center transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/50 hover:border-primary/30',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}>
                  {cycleConfig.name}
                </div>
                <div className={cn(
                  'text-xs mt-1',
                  isSelected ? 'text-primary/70' : 'text-muted-foreground'
                )}>
                  {formatPrice(price)}
                  {cycleConfig.discount && (
                    <span className="ml-1 text-[10px] text-success">({cycleConfig.discount})</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
