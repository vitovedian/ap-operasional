import { Checkbox as UiCheckbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function Checkbox({ className = '', ...props }) {
  return <UiCheckbox className={cn(className)} {...props} />;
}
