import type { PaymentMethod } from '../lib/config';
import { PAYMENT_METHODS } from '../lib/config';
import { cn } from '../lib/utils';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({ paymentMethod, onPaymentMethodChange, disabled }: PaymentMethodSelectorProps) {
  const methods: PaymentMethod[] = ['alipay', 'wechat', 'balance'];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        支付方式
      </label>
      <div className="flex gap-2">
        {methods.map((m) => {
          const config = PAYMENT_METHODS[m];
          const isSelected = paymentMethod === m;
          return (
            <button
              key={m}
              onClick={() => onPaymentMethodChange(m)}
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
              <div className="text-lg mb-1">{config.icon}</div>
              <div className={cn(
                'text-xs font-medium',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {config.name}
              </div>
            </button>
          );
        })}
      </div>
      {paymentMethod === 'balance' && (
        <div className="text-[10px] text-muted-foreground px-2 py-1 rounded bg-secondary/30">
          ⚠️ 账户余额支付需要确保余额充足
        </div>
      )}
    </div>
  );
}