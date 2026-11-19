import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  // Shown as the card title on phones instead of a labelled row.
  primary?: boolean;
  // Left out of the phone card when the information is already in the title.
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  empty?: ReactNode;
  className?: string;
};

// A table from md up; a stack of cards below that, so nothing scrolls sideways.
export function DataTable<T>({ rows, columns, rowKey, actions, empty, className }: DataTableProps<T>) {
  if (rows.length === 0) return <>{empty}</>;
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const rest = columns.filter((column) => column !== primary && !column.hideOnMobile);

  return (
    <div className={className}>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="px-4 py-3.5">
            <div className="min-w-0">{primary.cell(row)}</div>
            {rest.length > 0 && (
              <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {rest.map((column) => (
                  <div key={column.key} className="contents">
                    <dt className="text-ink-3">{column.header}</dt>
                    <dd className="min-w-0 text-right text-ink [&>*]:ml-auto">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions && <div className="mt-3 flex flex-wrap gap-2 [&>*]:flex-1">{actions(row)}</div>}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-3">
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn("px-5 py-2.5 font-medium whitespace-nowrap", column.className)}>
                  {column.header}
                </th>
              ))}
              {actions && <th scope="col" className="px-5 py-2.5"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="align-middle hover:bg-canvas/60">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-5 py-3 text-ink", column.className)}>{column.cell(row)}</td>
                ))}
                {actions && (
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
