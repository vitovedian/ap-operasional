import { cn } from '@/lib/utils';

export default function InputError({ message, className = '', ...props }) {
  if (!message) return null;

  return (
    <p {...props} className={cn('text-sm text-destructive', className)}>
      {message}
    </p>
  );
}
