import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Product } from '@/types/api'

type ProductPayload = { items: Product[] }

type ProductForm = {
  name: string
  category: 'tea' | 'masala'
  description: string
  unit: string
  price: string
  status: 'active' | 'inactive'
}

const defaultForm: ProductForm = {
  name: '',
  category: 'tea',
  description: '',
  unit: '',
  price: '',
  status: 'active',
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState<ProductForm>(defaultForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['products', search, category],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<ProductPayload>>('/products', {
        params: { search, category: category || undefined, per_page: 100 },
      })
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
        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" required />
          <select
            className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as 'tea' | 'masala' }))}
          >
            <option value="tea">Tea</option>
            <option value="masala">Masala</option>
          </select>
          <Input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="Unit (kg, packet...)" required />
          <Input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price" required type="number" />
          <select
            className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit">{editingId ? 'Update Product' : 'Create Product'}</Button>
          <textarea
            className="md:col-span-3 rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </form>
      </Card>

      <Card>
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <Input placeholder="Search by name" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            <option value="tea">Tea</option>
            <option value="masala">Masala</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#2D6A4F] text-left text-white">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product, index) => (
                <tr className={index % 2 ? 'bg-white' : 'bg-[#F8FAF8]'} key={product.id}>
                  <td className="px-2 py-2">{product.name}</td>
                  <td className="px-2 py-2 capitalize">{product.category}</td>
                  <td className="px-2 py-2">{product.unit}</td>
                  <td className="px-2 py-2 font-data">Rs {product.price}</td>
                  <td className="px-2 py-2">
                    <Badge className={product.status === 'active' ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-[#F7D6D8] text-[#D64045]'}>{product.status}</Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Button
                        className="bg-[#40916C] hover:bg-[#2D6A4F]"
                        onClick={() => {
                          setEditingId(product.id)
                          setForm({
                            name: product.name,
                            category: product.category,
                            description: product.description ?? '',
                            unit: product.unit,
                            price: product.price,
                            status: product.status,
                          })
                        }}
                        type="button"
                      >
                        Edit
                      </Button>
                      <Button
                        className="bg-[#D64045] hover:bg-[#b63035]"
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
