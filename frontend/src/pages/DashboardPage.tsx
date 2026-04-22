import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'

type DashboardPayload = {
  totals: {
    sales: string
    payments: string
    due: string
    today_sales: string
  }
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard')
      return response.data.data as DashboardPayload
    },
  })

  const totals = query.data?.totals

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['Total Sales', totals?.sales ?? '0.00'],
        ['Total Payments', totals?.payments ?? '0.00'],
        ['Current Due', totals?.due ?? '0.00'],
        ['Today Sales', totals?.today_sales ?? '0.00'],
      ].map(([label, value]) => (
        <Card key={label}>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold">Rs {value}</p>
        </Card>
      ))}
    </div>
  )
}
