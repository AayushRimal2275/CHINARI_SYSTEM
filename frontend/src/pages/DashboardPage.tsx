import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'

type DashboardPayload = {
  totals: {
    products: number
    vendors: number
    today_sales: string
    low_stock_alerts: number
  }
  revenue: {
    weekly: string
    monthly: string
  }
  low_stock: Array<{ id: number; product: { name: string }; quantity_in_stock?: string; quantity?: string }>
  recent_transactions: Array<{ id: number; amount_paid?: string; amount?: string; payment_method: string; payment_date: string }>
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard')
      return response.data.data as DashboardPayload
    },
  })

  const payload = query.data
  const totals = payload?.totals

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total Products', String(totals?.products ?? 0)],
          ['Total Vendors', String(totals?.vendors ?? 0)],
          ["Today's Sales", `Rs ${totals?.today_sales ?? '0.00'}`],
          ['Low Stock Alerts', String(totals?.low_stock_alerts ?? 0)],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-[#4A6358]">{label}</p>
            <p className="mt-1 text-2xl font-semibold font-data">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg">Revenue Summary</h3>
          <p className="text-sm text-[#4A6358]">Weekly: <span className="font-data">Rs {payload?.revenue.weekly ?? '0.00'}</span></p>
          <p className="text-sm text-[#4A6358]">Monthly: <span className="font-data">Rs {payload?.revenue.monthly ?? '0.00'}</span></p>
        </Card>

        <Card>
          <h3 className="mb-3 text-lg">Low Stock Alerts</h3>
          <div className="space-y-2 text-sm">
            {(payload?.low_stock ?? []).map((item) => (
              <div className="flex items-center justify-between rounded-md border border-[#C7E4CE] bg-white px-3 py-2" key={item.id}>
                <span>{item.product?.name}</span>
                <Badge className="bg-[#FCECC6] text-[#E9A825]">Qty {item.quantity_in_stock ?? item.quantity}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-lg">Recent Transactions</h3>
        <div className="space-y-2 text-sm">
          {(payload?.recent_transactions ?? []).map((transaction) => (
            <div className="flex items-center justify-between rounded-md border border-[#C7E4CE] bg-white px-3 py-2" key={transaction.id}>
              <span className="capitalize">{transaction.payment_method}</span>
              <span className="font-data">Rs {transaction.amount_paid ?? transaction.amount}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
