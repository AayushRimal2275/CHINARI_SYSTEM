import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Product, type Sale } from '@/types/api'

type SalesPayload = { items: Sale[] }
type ProductsPayload = { items: Product[] }

type SaleLine = { product_id: string; quantity: string; unit_price: string }
type SaleForm = {
  customer_name: string
  customer_phone: string
  sale_date: string
  notes: string
  items: SaleLine[]
}

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
  const [form, setForm] = useState<SaleForm>(defaultForm)

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

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/sales', {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        sale_date: form.sale_date || undefined,
        notes: form.notes,
        items: form.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      })
    },
    onSuccess: async () => {
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['sales'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const totals = useMemo(() => (salesQuery.data ?? []).reduce((sum, sale) => sum + Number(sale.total_amount), 0), [salesQuery.data])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
          <Input value={form.customer_name} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} placeholder="Customer name" required />
          <Input value={form.customer_phone} onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))} placeholder="Customer phone" />
          <Input value={form.sale_date} onChange={(event) => setForm((current) => ({ ...current, sale_date: event.target.value }))} type="date" />
          <Button type="submit">Create Sale</Button>
          <Input className="md:col-span-4" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" />

          {form.items.map((item, index) => (
            <div className="grid gap-2 md:col-span-4 md:grid-cols-4" key={index}>
              <select
                className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
                required
                value={item.product_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    items: current.items.map((line, lineIndex) => (lineIndex === index ? { ...line, product_id: event.target.value } : line)),
                  }))
                }
              >
                <option value="">Select product</option>
                {(productsQuery.data ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <Input
                required
                type="number"
                value={item.quantity}
                placeholder="Quantity"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    items: current.items.map((line, lineIndex) => (lineIndex === index ? { ...line, quantity: event.target.value } : line)),
                  }))
                }
              />
              <Input
                required
                type="number"
                value={item.unit_price}
                placeholder="Unit price"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    items: current.items.map((line, lineIndex) => (lineIndex === index ? { ...line, unit_price: event.target.value } : line)),
                  }))
                }
              />
              <Button
                className="bg-[#40916C] hover:bg-[#2D6A4F]"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: [...current.items, { product_id: '', quantity: '', unit_price: '' }],
                  }))
                }
                type="button"
              >
                Add Item
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
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#2D6A4F] text-left text-white">
                <th className="px-2 py-2">Sale #</th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(salesQuery.data ?? []).map((sale, index) => (
                <tr className={index % 2 ? 'bg-white' : 'bg-[#F8FAF8]'} key={sale.id}>
                  <td className="px-2 py-2">{sale.sale_number}</td>
                  <td className="px-2 py-2">{sale.customer_name}</td>
                  <td className="px-2 py-2">{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td className="px-2 py-2 font-data">Rs {sale.total_amount}</td>
                  <td className="px-2 py-2">
                    <Badge
                      className={
                        sale.payment_status === 'paid'
                          ? 'bg-[#D8F3DC] text-[#2D6A4F]'
                          : sale.payment_status === 'partial'
                            ? 'bg-[#FCECC6] text-[#E9A825]'
                            : 'bg-[#F7D6D8] text-[#D64045]'
                      }
                    >
                      {sale.payment_status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
