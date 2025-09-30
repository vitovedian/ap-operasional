import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PrimaryButton({ className = '', disabled, children, ...props }) {
  return (
    <Button
      {...props}
      disabled={disabled}
      className={cn('text-xs font-semibold uppercase tracking-widest', className)}
    >
      {children}
    </Button>
  );
}
