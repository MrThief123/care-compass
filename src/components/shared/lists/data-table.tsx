import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Present enables a trailing chevron column and makes rows clickable. */
  onRowClick?: (row: T) => void;
  className?: string;
}

/** Uppercase label header, 50px rows, optional chevron link column (UI-03 PRD.md Scope). */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, className }: DataTableProps<T>) {
  return (
    <table className={cn("w-full border-collapse text-left", className)}>
      <thead>
        <tr className="border-b border-border-default">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className="px-3 py-2 text-label-caps text-text-secondary"
            >
              {column.header}
            </th>
          ))}
          {onRowClick && <th scope="col" className="w-8" aria-hidden />}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const key = rowKey(row);
          return (
            <tr
              key={key}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "h-[50px] border-b border-border-subtle",
                onRowClick && "cursor-pointer hover:bg-bg-inset",
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2 text-body-default text-text-primary">
                  {column.render(row)}
                </td>
              ))}
              {onRowClick && (
                <td className="px-3 py-2">
                  <Icon
                    name="chevron-right"
                    size={16}
                    className="text-text-secondary"
                    aria-hidden
                  />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
