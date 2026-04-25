import { zodResolver } from '@hookform/resolvers/zod'
import { type ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Payment, type Sale } from '@/types/api'

type SalesPayload = { items: Sale[] }
type PaymentPayload = { items: Payment[] }

const numericString = z
  .string()
  .min(1, 'Required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Enter a valid number')

const paymentSchema = z.object({
  sale_id: z.string().min(1, 'Select a sale'),
  amount_paid: numericString,
  payment_method: z.enum(['cash', 'esewa', 'bank']),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentForm = z.infer<typeof paymentSchema>

const defaultForm: PaymentForm = {
  sale_id: '',
  amount_paid: '',
  payment_method: 'cash',
  payment_date: '',
  notes: '',
}

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: defaultForm,
  })

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
    mutationFn: async (values: PaymentForm) => {
      await api.post('/payments', {
        sale_id: Number(values.sale_id),
        amount_paid: Number(values.amount_paid),
        payment_method: values.payment_method,
        payment_date: values.payment_date || undefined,
        notes: values.notes,
      })
    },
    onSuccess: async () => {
      reset(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['sales'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Payment recorded.')
    },
    onError: () => toast.error('Unable to record payment.'),
  })

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        header: 'Sale #',
        cell: ({ row }) => row.original.sale?.sale_number ?? row.original.sale_id,
      },
      {
        header: 'Amount',
        accessorKey: 'amount_paid',
        cell: (info) => <span className="font-data">Rs {info.getValue<string>()}</span>,
      },
      {
        header: 'Method',
        accessorKey: 'payment_method',
        cell: (info) => <span className="capitalize">{info.getValue<string>()}</span>,
      },
      {
        header: 'Date',
        accessorKey: 'payment_date',
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: 'Sale Status',
        cell: ({ row }) => {
          const status = row.original.sale?.payment_status ?? 'unpaid'
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
    ],
    [],
  )

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-5" onSubmit={onSubmit}>
          <div>
            <select className="w-full rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" {...register('sale_id')}>
            <option value="">Select sale</option>
            {(salesQuery.data ?? []).map((sale) => (
              <option key={sale.id} value={sale.id}>
                {sale.sale_number} - {sale.customer_name}
              </option>
            ))}
          </select>
            {errors.sale_id ? <p className="mt-1 text-xs text-[#D64045]">{errors.sale_id.message}</p> : null}
          </div>
          <div>
            <Input type="number" placeholder="Amount paid" {...register('amount_paid')} />
            {errors.amount_paid ? <p className="mt-1 text-xs text-[#D64045]">{errors.amount_paid.message}</p> : null}
          </div>
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" {...register('payment_method')}>
            <option value="cash">Cash</option>
            <option value="esewa">eSewa</option>
            <option value="bank">Bank</option>
          </select>
          <Input type="date" {...register('payment_date')} />
          <Button disabled={isSubmitting} type="submit">
            Record Payment
          </Button>
          <Input className="md:col-span-5" placeholder="Notes" {...register('notes')} />
        </form>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={paymentsQuery.data ?? []}
          emptyMessage="No payments recorded."
          getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
        />
      </Card>
    </div>
  )
}
