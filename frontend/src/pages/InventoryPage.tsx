import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Inventory, type Product, type StockMovement } from '@/types/api'

type InventoryPayload = { items: Inventory[] }
type ProductsPayload = { items: Product[] }
type MovementPayload = { movements: StockMovement[] }

type MovementForm = {
  product_id: string
  movement_type: 'in' | 'out'
  quantity: string
  note: string
}

const defaultForm: MovementForm = {
  product_id: '',
  movement_type: 'in',
  quantity: '',
  note: '',
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<MovementForm>(defaultForm)
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null)

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<InventoryPayload>>('/inventory', { params: { per_page: 100 } })
      return response.data.data.items
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products-for-inventory'],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<ProductsPayload>>('/products', { params: { per_page: 100 } })
      return response.data.data.items
    },
  })

  const movementQuery = useQuery({
    queryKey: ['inventory-movements', selectedInventoryId],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<MovementPayload>>(`/inventory/${selectedInventoryId}`)
      return response.data.data.movements
    },
    enabled: selectedInventoryId !== null,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/inventory/adjust', {
        product_id: Number(form.product_id),
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        note: form.note,
      })
    },
    onSuccess: async () => {
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" required value={form.product_id} onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))}>
            <option value="">Select product</option>
            {(productsQuery.data ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" value={form.movement_type} onChange={(event) => setForm((current) => ({ ...current, movement_type: event.target.value as 'in' | 'out' }))}>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
          <Input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="Quantity" required type="number" />
          <Button type="submit">Record Movement</Button>
          <Input className="md:col-span-4" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Note" />
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#2D6A4F] text-left text-white">
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">In Stock</th>
                <th className="px-2 py-2">Reorder Level</th>
                <th className="px-2 py-2">Alert</th>
                <th className="px-2 py-2">History</th>
              </tr>
            </thead>
            <tbody>
              {(inventoryQuery.data ?? []).map((row, index) => (
                <tr className={index % 2 ? 'bg-white' : 'bg-[#F8FAF8]'} key={row.id}>
                  <td className="px-2 py-2">{row.product?.name}</td>
                  <td className="px-2 py-2 font-data">{row.quantity_in_stock}</td>
                  <td className="px-2 py-2 font-data">{row.reorder_level}</td>
                  <td className="px-2 py-2">
                    {row.is_low_stock ? <Badge className="bg-[#FCECC6] text-[#E9A825]">Low stock</Badge> : <Badge>In stock</Badge>}
                  </td>
                  <td className="px-2 py-2">
                    <Button className="bg-[#40916C] hover:bg-[#2D6A4F]" onClick={() => setSelectedInventoryId(row.id)} type="button">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedInventoryId ? (
        <Card>
          <h3 className="mb-3 text-lg">Movement History</h3>
          <div className="space-y-2 text-sm">
            {(movementQuery.data ?? []).map((movement) => (
              <div className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2" key={movement.id}>
                <span className="font-medium uppercase">{movement.movement_type}</span> ·{' '}
                <span className="font-data">{movement.quantity}</span> · {movement.note || 'No note'}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
