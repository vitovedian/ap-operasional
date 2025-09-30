import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DangerButton({ className = '', disabled, children, ...props }) {
  return (
    <Button
      {...props}
      variant="destructive"
      disabled={disabled}
      className={cn('text-xs font-semibold uppercase tracking-widest', className)}
    >
      {children}
    </Button>
  );
}
