import type { PlanType } from '../lib/config';
import { PLANS } from '../lib/config';
import { cn } from '../lib/utils';

interface PlanSelectorProps {
  plan: PlanType;
  onPlanChange: (plan: PlanType) => void;
  disabled?: boolean;
}

export function PlanSelector({ plan, onPlanChange, disabled }: PlanSelectorProps) {
  const plans: PlanType[] = ['lite', 'pro', 'max'];

  return (
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
                {config.price}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
