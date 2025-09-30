import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }) {
  return (
    <Button
      {...props}
      type={type}
      variant="outline"
      disabled={disabled}
      className={cn('text-xs font-semibold uppercase tracking-widest', className)}
    >
      {children}
    </Button>
  );
}
