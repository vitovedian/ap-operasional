import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default forwardRef(function TextInput({ type = 'text', className = '', isFocused = false, ...props }, ref) {
  const localRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => localRef.current?.focus(),
  }));

  useEffect(() => {
    if (isFocused) {
      localRef.current?.focus();
    }
  }, [isFocused]);

  return <Input {...props} type={type} ref={localRef} className={cn(className)} />;
});
