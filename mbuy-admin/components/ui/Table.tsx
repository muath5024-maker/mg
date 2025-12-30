'use client';

import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type TableProps = HTMLAttributes<HTMLTableElement>

const Table = forwardRef<HTMLTableElement, TableProps>(({ className, children, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table ref={ref} className={cn('w-full text-sm', className)} {...props}>
      {children}
    </table>
  </div>
));

Table.displayName = 'Table';

type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={cn('border-b border-zinc-800', className)} {...props}>
      {children}
    </thead>
  )
);

TableHeader.displayName = 'TableHeader';

type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-zinc-800/50', className)} {...props}>
      {children}
    </tbody>
  )
);

TableBody.displayName = 'TableBody';

type TableRowProps = HTMLAttributes<HTMLTableRowElement>

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('hover:bg-zinc-800/30 transition-colors', className)}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = 'TableRow';

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);

TableHead.displayName = 'TableHead';

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 text-zinc-300', className)} {...props}>
      {children}
    </td>
  )
);

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
