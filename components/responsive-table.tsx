'use client';

import { ReactNode } from 'react';

/**
 * ResponsiveTable renders a native <table> on md+ screens and a card list
 * on smaller screens. This prevents horizontal scroll on mobile devices
 * while keeping the familiar table layout on desktop.
 *
 * Usage:
 *   <ResponsiveTable columns={columns} rows={rows}>
 *     {(row) => <ActionsForRow row={row} />}
 *   </ResponsiveTable>
 */
interface Column<R> {
  key: string;
  header: string;
  render: (row: R) => ReactNode;
}

interface ResponsiveTableProps<R> {
  columns: Column<R>[];
  rows: R[];
  emptyMessage?: string;
  actions?: (row: R) => ReactNode;
  rowKey: (row: R) => string;
}

export default function ResponsiveTable<R extends object>({
  columns,
  rows,
  emptyMessage = 'No data available',
  actions,
  rowKey,
}: ResponsiveTableProps<R>) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: native table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-sm">
                    {col.render(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2 text-right">{actions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key}>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {col.header}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                    {col.render(row)}
                  </div>
                </div>
              ))}
              {actions && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  {actions(row)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
