import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormEvent, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Product } from '@/types/api'

type ProductPayload = { items: Product[] }

type ProductForm = {
  name: string
  unit: string
  price_per_unit: string
}

const defaultForm: ProductForm = {
  name: '',
  unit: '',
  price_per_unit: '',
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<ProductForm>(defaultForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<ProductPayload>>('/products', { params: { search, per_page: 50 } })
      return response.data.data.items
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await api.put(`/products/${editingId}`, form)
      } else {
        await api.post('/products', form)
      }
    },
    onSuccess: async () => {
      setForm(defaultForm)
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/products/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const rows = useMemo(() => query.data ?? [], [query.data])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
          <Input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Product name"
            required
          />
          <Input
            value={form.unit}
            onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
            placeholder="Unit (kg, packet...)"
            required
          />
          <Input
            value={form.price_per_unit}
            onChange={(event) => setForm((current) => ({ ...current, price_per_unit: event.target.value }))}
            placeholder="Price"
            required
            type="number"
          />
          <Button type="submit">{editingId ? 'Update Product' : 'Create Product'}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input placeholder="Search by name/unit" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr className="border-b border-slate-100" key={product.id}>
                  <td className="px-2 py-2">{product.name}</td>
                  <td className="px-2 py-2">{product.unit}</td>
                  <td className="px-2 py-2">Rs {product.price_per_unit}</td>
                  <td className="px-2 py-2">
                    <Badge className={product.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Button
                        className="bg-blue-600 hover:bg-blue-500"
                        onClick={() => {
                          setEditingId(product.id)
                          setForm({
                            name: product.name,
                            unit: product.unit,
                            price_per_unit: product.price_per_unit,
                          })
                        }}
                        type="button"
                      >
                        Edit
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-500"
                        onClick={() => {
                          if (window.confirm('Delete this product?')) {
                            deleteMutation.mutate(product.id)
                          }
                        }}
                        type="button"
                      >
                        Delete
                      </Button>
                    </div>
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
