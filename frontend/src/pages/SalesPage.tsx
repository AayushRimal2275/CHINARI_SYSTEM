import { zodResolver } from '@hookform/resolvers/zod'
import { type ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Product, type Sale } from '@/types/api'

type SalesPayload = { items: Sale[] }
type ProductsPayload = { items: Product[] }

const numericString = z
  .string()
  .min(1, 'Required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Enter a valid number')

const saleItemSchema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  quantity: numericString,
  unit_price: numericString,
})

const saleSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  sale_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'Add at least one item'),
})

type SaleForm = z.infer<typeof saleSchema>

const defaultForm: SaleForm = {
  customer_name: '',
  customer_phone: '',
  sale_date: '',
  notes: '',
  items: [{ product_id: '', quantity: '', unit_price: '' }],
}

export function SalesPage() {
  const queryClient = useQueryClient()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: defaultForm,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const salesQuery = useQuery({
    queryKey: ['sales', fromDate, toDate],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<SalesPayload>>('/sales', {
        params: { from_date: fromDate || undefined, to_date: toDate || undefined, per_page: 100 },
      })
      return response.data.data.items
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products-for-sales'],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<ProductsPayload>>('/products', { params: { per_page: 100 } })
      return response.data.data.items
    },
  })

  const saleDetailQuery = useQuery({
    queryKey: ['sale', selectedSaleId],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<Sale>>(`/sales/${selectedSaleId}`)
      return response.data.data
    },
    enabled: selectedSaleId !== null,
  })

  const mutation = useMutation({
    mutationFn: async (values: SaleForm) => {
      await api.post('/sales', {
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        sale_date: values.sale_date || undefined,
        notes: values.notes,
        items: values.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      })
    },
    onSuccess: async () => {
      reset(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['sales'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Sale created.')
    },
    onError: () => toast.error('Unable to create sale.'),
  })

  const totals = useMemo(() => (salesQuery.data ?? []).reduce((sum, sale) => sum + Number(sale.total_amount), 0), [salesQuery.data])

  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        header: 'Sale #',
        accessorKey: 'sale_number',
      },
      {
        header: 'Customer',
        accessorKey: 'customer_name',
      },
      {
        header: 'Date',
        accessorKey: 'sale_date',
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: 'Amount',
        accessorKey: 'total_amount',
        cell: (info) => <span className="font-data">Rs {info.getValue<string>()}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'payment_status',
        cell: (info) => {
          const status = info.getValue<'paid' | 'partial' | 'unpaid'>()
          return (
            <Badge
              className={
                status === 'paid' ? 'bg-[#D8F3DC] text-[#2D6A4F]' : status === 'partial' ? 'bg-[#FCECC6] text-[#E9A825]' : 'bg-[#F7D6D8] text-[#D64045]'
              }
            >
              {status}
            </Badge>
          )
        },
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <Button className="bg-[#40916C] hover:bg-[#2D6A4F]" onClick={() => setSelectedSaleId(row.original.id)} type="button">
            View
          </Button>
        ),
      },
    ],
    [],
  )

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
          <div>
            <Input placeholder="Customer name" {...register('customer_name')} />
            {errors.customer_name ? <p className="mt-1 text-xs text-[#D64045]">{errors.customer_name.message}</p> : null}
          </div>
          <Input placeholder="Customer phone" {...register('customer_phone')} />
          <Input type="date" {...register('sale_date')} />
          <Button disabled={isSubmitting} type="submit">
            Create Sale
          </Button>
          <Input className="md:col-span-4" placeholder="Notes" {...register('notes')} />

          {fields.map((field, index) => (
            <div className="grid gap-2 md:col-span-4 md:grid-cols-5" key={field.id}>
              <div>
                <select className="w-full rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" {...register(`items.${index}.product_id`)}>
                  <option value="">Select product</option>
                  {(productsQuery.data ?? []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {errors.items?.[index]?.product_id ? <p className="mt-1 text-xs text-[#D64045]">{errors.items[index]?.product_id?.message}</p> : null}
              </div>
              <div>
                <Input type="number" placeholder="Quantity" {...register(`items.${index}.quantity`)} />
                {errors.items?.[index]?.quantity ? <p className="mt-1 text-xs text-[#D64045]">{errors.items[index]?.quantity?.message}</p> : null}
              </div>
              <div>
                <Input type="number" placeholder="Unit price" {...register(`items.${index}.unit_price`)} />
                {errors.items?.[index]?.unit_price ? <p className="mt-1 text-xs text-[#D64045]">{errors.items[index]?.unit_price?.message}</p> : null}
              </div>
              <Button
                className="bg-[#40916C] hover:bg-[#2D6A4F]"
                onClick={() => append({ product_id: '', quantity: '', unit_price: '' })}
                type="button"
              >
                Add Item
              </Button>
              <Button
                className="border border-[#D64045] bg-white text-[#D64045] hover:bg-[#F7D6D8]"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                type="button"
              >
                Remove
              </Button>
            </div>
          ))}
        </form>
      </Card>

      <Card>
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <div className="rounded-md border border-[#C7E4CE] px-3 py-2 text-sm">
            Revenue in list: <span className="font-data">Rs {totals.toFixed(2)}</span>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={salesQuery.data ?? []}
          emptyMessage="No sales found."
          getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
        />
      </Card>

      {selectedSaleId ? (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg">Sale Details</h3>
              <p className="text-sm text-[#4A6358]">Sale #{saleDetailQuery.data?.sale_number ?? selectedSaleId}</p>
            </div>
            <Button
              className="border border-[#40916C] bg-white text-[#40916C] hover:bg-[#D8F3DC]"
              onClick={() => setSelectedSaleId(null)}
              type="button"
            >
              Close
            </Button>
          </div>
          <div className="mb-3 grid gap-2 md:grid-cols-3 text-sm">
            <div className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2">
              <p className="text-[#4A6358]">Customer</p>
              <p className="font-medium">{saleDetailQuery.data?.customer_name ?? '-'}</p>
            </div>
            <div className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2">
              <p className="text-[#4A6358]">Total</p>
              <p className="font-data">Rs {saleDetailQuery.data?.total_amount ?? '0.00'}</p>
            </div>
            <div className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2">
              <p className="text-[#4A6358]">Status</p>
              <Badge
                className={
                  saleDetailQuery.data?.payment_status === 'paid'
                    ? 'bg-[#D8F3DC] text-[#2D6A4F]'
                    : saleDetailQuery.data?.payment_status === 'partial'
                      ? 'bg-[#FCECC6] text-[#E9A825]'
                      : 'bg-[#F7D6D8] text-[#D64045]'
                }
              >
                {saleDetailQuery.data?.payment_status ?? 'unpaid'}
              </Badge>
            </div>
          </div>
          <DataTable
            columns={[
              { header: 'Product', accessorKey: 'product_name' },
              {
                header: 'Quantity',
                accessorKey: 'quantity',
                cell: (info) => <span className="font-data">{info.getValue<string>()}</span>,
              },
              {
                header: 'Unit Price',
                accessorKey: 'unit_price',
                cell: (info) => <span className="font-data">Rs {info.getValue<string>()}</span>,
              },
              {
                header: 'Subtotal',
                accessorKey: 'subtotal',
                cell: (info) => <span className="font-data">Rs {info.getValue<string>()}</span>,
              },
            ]}
            data={saleDetailQuery.data?.items ?? []}
            emptyMessage="No items recorded."
            getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
          />
        </Card>
      ) : null}
    </div>
  )
}
