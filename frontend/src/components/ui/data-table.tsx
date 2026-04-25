import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type Row } from '@tanstack/react-table'

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage?: string
  getRowClassName?: (row: Row<TData>, index: number) => string
}

export function DataTable<TData>({ columns, data, emptyMessage = 'No records found.', getRowClassName }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className="bg-[#2D6A4F] text-left text-white" key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th className="px-2 py-2" key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr className={getRowClassName ? getRowClassName(row, index) : undefined} key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td className="px-2 py-2" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-2 py-6 text-center text-[#4A6358]" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
