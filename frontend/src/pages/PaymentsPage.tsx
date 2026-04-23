import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Payment, type Sale } from '@/types/api'

type SalesPayload = { items: Sale[] }
type PaymentPayload = { items: Payment[] }

type PaymentForm = {
  sale_id: string
  amount_paid: string
  payment_method: 'cash' | 'esewa' | 'bank'
  payment_date: string
  notes: string
}

const defaultForm: PaymentForm = {
  sale_id: '',
  amount_paid: '',
  payment_method: 'cash',
  payment_date: '',
  notes: '',
}

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PaymentForm>(defaultForm)

  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<PaymentPayload>>('/payments', { params: { per_page: 100 } })
      return response.data.data.items
    },
  })

  const salesQuery = useQuery({
    queryKey: ['sales-for-payments'],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<SalesPayload>>('/sales', { params: { per_page: 100 } })
      return response.data.data.items
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/payments', {
        sale_id: Number(form.sale_id),
        amount_paid: Number(form.amount_paid),
        payment_method: form.payment_method,
        payment_date: form.payment_date || undefined,
        notes: form.notes,
      })
    },
    onSuccess: async () => {
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['sales'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-5" onSubmit={handleSubmit}>
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" required value={form.sale_id} onChange={(event) => setForm((current) => ({ ...current, sale_id: event.target.value }))}>
            <option value="">Select sale</option>
            {(salesQuery.data ?? []).map((sale) => (
              <option key={sale.id} value={sale.id}>
                {sale.sale_number} - {sale.customer_name}
              </option>
            ))}
          </select>
          <Input required type="number" value={form.amount_paid} onChange={(event) => setForm((current) => ({ ...current, amount_paid: event.target.value }))} placeholder="Amount paid" />
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value as 'cash' | 'esewa' | 'bank' }))}>
            <option value="cash">Cash</option>
            <option value="esewa">eSewa</option>
            <option value="bank">Bank</option>
          </select>
          <Input type="date" value={form.payment_date} onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))} />
          <Button type="submit">Record Payment</Button>
          <Input className="md:col-span-5" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" />
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#2D6A4F] text-left text-white">
                <th className="px-2 py-2">Sale #</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Method</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Sale Status</th>
              </tr>
            </thead>
            <tbody>
              {(paymentsQuery.data ?? []).map((payment, index) => (
                <tr className={index % 2 ? 'bg-white' : 'bg-[#F8FAF8]'} key={payment.id}>
                  <td className="px-2 py-2">{payment.sale?.sale_number ?? payment.sale_id}</td>
                  <td className="px-2 py-2 font-data">Rs {payment.amount_paid}</td>
                  <td className="px-2 py-2 capitalize">{payment.payment_method}</td>
                  <td className="px-2 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="px-2 py-2">
                    <Badge
                      className={
                        payment.sale?.payment_status === 'paid'
                          ? 'bg-[#D8F3DC] text-[#2D6A4F]'
                          : payment.sale?.payment_status === 'partial'
                            ? 'bg-[#FCECC6] text-[#E9A825]'
                            : 'bg-[#F7D6D8] text-[#D64045]'
                      }
                    >
                      {payment.sale?.payment_status ?? 'unpaid'}
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
