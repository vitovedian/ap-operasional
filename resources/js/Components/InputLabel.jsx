import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function InputLabel({ value, className = '', children, ...props }) {
  return (
    <Label {...props} className={cn('text-sm font-medium text-foreground', className)}>
      {value ?? children}
    </Label>
  );
}
