import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Vendor } from '@/types/api'

type VendorPayload = { items: Vendor[] }

type VendorForm = {
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  product_categories_supplied: ('tea' | 'masala')[]
  status: 'active' | 'inactive'
}

const defaultForm: VendorForm = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  product_categories_supplied: ['tea'],
  status: 'active',
}

export function VendorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<VendorForm>(defaultForm)

  const query = useQuery({
    queryKey: ['vendors', search],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<VendorPayload>>('/vendors', { params: { search, per_page: 100 } })
      return response.data.data.items
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await api.put(`/vendors/${editingId}`, form)
      } else {
        await api.post('/vendors', form)
      }
    },
    onSuccess: async () => {
      setForm(defaultForm)
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/vendors/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Vendor name" required />
          <Input value={form.contact_person} onChange={(event) => setForm((current) => ({ ...current, contact_person: event.target.value }))} placeholder="Contact person" />
          <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" />
          <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
          <Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Address" />
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="md:col-span-3 flex items-center gap-2 text-sm text-[#4A6358]">
            <input
              type="checkbox"
              checked={form.product_categories_supplied.includes('tea')}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  product_categories_supplied: event.target.checked
                    ? Array.from(new Set([...current.product_categories_supplied, 'tea']))
                    : current.product_categories_supplied.filter((item) => item !== 'tea'),
                }))
              }
            />
            Tea
            <input
              className="ml-4"
              type="checkbox"
              checked={form.product_categories_supplied.includes('masala')}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  product_categories_supplied: event.target.checked
                    ? Array.from(new Set([...current.product_categories_supplied, 'masala']))
                    : current.product_categories_supplied.filter((item) => item !== 'masala'),
                }))
              }
            />
            Masala
          </label>
          <Button type="submit">{editingId ? 'Update Vendor' : 'Create Vendor'}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3">
          <Input placeholder="Search vendors" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#2D6A4F] text-left text-white">
                <th className="px-2 py-2">Vendor</th>
                <th className="px-2 py-2">Contact</th>
                <th className="px-2 py-2">Categories</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((vendor, index) => (
                <tr className={index % 2 ? 'bg-white' : 'bg-[#F8FAF8]'} key={vendor.id}>
                  <td className="px-2 py-2">{vendor.name}</td>
                  <td className="px-2 py-2">{vendor.contact_person || vendor.phone || '-'}</td>
                  <td className="px-2 py-2 capitalize">{(vendor.product_categories_supplied ?? []).join(', ') || '-'}</td>
                  <td className="px-2 py-2">
                    <Badge className={vendor.status === 'active' ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-[#F7D6D8] text-[#D64045]'}>{vendor.status}</Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Button
                        className="bg-[#40916C] hover:bg-[#2D6A4F]"
                        onClick={() => {
                          setEditingId(vendor.id)
                          setForm({
                            name: vendor.name,
                            contact_person: vendor.contact_person ?? '',
                            phone: vendor.phone ?? '',
                            email: vendor.email ?? '',
                            address: vendor.address ?? '',
                            product_categories_supplied: (vendor.product_categories_supplied as ('tea' | 'masala')[]) ?? [],
                            status: vendor.status,
                          })
                        }}
                        type="button"
                      >
                        Edit
                      </Button>
                      <Button
                        className="bg-[#D64045] hover:bg-[#b63035]"
                        onClick={() => {
                          if (window.confirm('Delete this vendor?')) {
                            deleteMutation.mutate(vendor.id)
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
