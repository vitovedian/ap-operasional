import { cn } from '@/lib/utils';

function Table({ className, ...props }) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
}

function TableHeader({ className, ...props }) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }) {
  return <tfoot className={cn('bg-muted/50 font-medium text-muted-foreground', className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return <tr className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)} {...props} />;
}

function TableHead({ className, ...props }) {
  return <th className={cn('h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0', className)} {...props} />;
}

function TableCell({ className, ...props }) {
  return <td className={cn('p-2 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />;
}

function TableCaption({ className, ...props }) {
  return <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
