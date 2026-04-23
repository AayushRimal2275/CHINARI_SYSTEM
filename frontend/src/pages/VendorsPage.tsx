import { zodResolver } from '@hookform/resolvers/zod'
import { type ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { type ApiEnvelope, type Product, type Vendor } from '@/types/api'

type VendorPayload = { items: Vendor[] }

const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  product_categories_supplied: z.array(z.enum(['tea', 'masala'])).optional(),
  product_ids: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']),
})

type VendorForm = z.infer<typeof vendorSchema>

const defaultForm: VendorForm = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  product_categories_supplied: ['tea'],
  product_ids: [],
  status: 'active',
}

export function VendorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema),
    defaultValues: defaultForm,
  })

  const query = useQuery({
    queryKey: ['vendors', search],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<VendorPayload>>('/vendors', { params: { search, per_page: 100 } })
      return response.data.data.items
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products-for-vendors'],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<{ items: Product[] }>>('/products', { params: { per_page: 200 } })
      return response.data.data.items
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: VendorForm) => {
      const payload = {
        ...values,
        email: values.email || null,
        product_categories_supplied: values.product_categories_supplied ?? [],
        product_ids: (values.product_ids ?? []).map((id) => Number(id)),
      }
      if (editingId) {
        await api.put(`/vendors/${editingId}`, payload)
      } else {
        await api.post('/vendors', payload)
      }
    },
    onSuccess: async () => {
      reset(defaultForm)
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(editingId ? 'Vendor updated.' : 'Vendor created.')
    },
    onError: () => toast.error('Unable to save vendor.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/vendors/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor deleted.')
    },
    onError: () => toast.error('Unable to delete vendor.'),
  })

  const categories = watch('product_categories_supplied') ?? []
  const productIds = watch('product_ids') ?? []

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      { header: 'Vendor', accessorKey: 'name' },
      {
        header: 'Contact',
        cell: ({ row }) => row.original.contact_person || row.original.phone || '-',
      },
      {
        header: 'Categories',
        cell: ({ row }) => {
          const categoriesList = row.original.product_categories_supplied ?? []
          return <span className="capitalize">{categoriesList.join(', ') || '-'}</span>
        },
      },
      {
        header: 'Products',
        cell: ({ row }) => {
          const products = row.original.products ?? []
          return <span>{products.length ? products.map((product) => product.name).join(', ') : '-'}</span>
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (info) => {
          const status = info.getValue<'active' | 'inactive'>()
          return <Badge className={status === 'active' ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-[#F7D6D8] text-[#D64045]'}>{status}</Badge>
        },
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => {
          const vendor = row.original
          return (
            <div className="flex gap-2">
              <Button
                className="bg-[#40916C] hover:bg-[#2D6A4F]"
                onClick={() => {
                  setEditingId(vendor.id)
                  reset({
                    name: vendor.name,
                    contact_person: vendor.contact_person ?? '',
                    phone: vendor.phone ?? '',
                    email: vendor.email ?? '',
                    address: vendor.address ?? '',
                    product_categories_supplied: (vendor.product_categories_supplied as ('tea' | 'masala')[]) ?? [],
                    product_ids: (vendor.products ?? []).map((product) => String(product.id)),
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
          )
        },
      },
    ],
    [deleteMutation, reset],
  )

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
          <div>
            <Input placeholder="Vendor name" {...register('name')} />
            {errors.name ? <p className="mt-1 text-xs text-[#D64045]">{errors.name.message}</p> : null}
          </div>
          <Input placeholder="Contact person" {...register('contact_person')} />
          <Input placeholder="Phone" {...register('phone')} />
          <div>
            <Input placeholder="Email" {...register('email')} />
            {errors.email ? <p className="mt-1 text-xs text-[#D64045]">{errors.email.message}</p> : null}
          </div>
          <Input placeholder="Address" {...register('address')} />
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="md:col-span-3 flex items-center gap-2 text-sm text-[#4A6358]">
            <input
              type="checkbox"
              checked={categories.includes('tea')}
              onChange={(event) =>
                setValue(
                  'product_categories_supplied',
                  event.target.checked
                    ? Array.from(new Set([...categories, 'tea']))
                    : categories.filter((item) => item !== 'tea'),
                )
              }
            />
            Tea
            <input
              className="ml-4"
              type="checkbox"
              checked={categories.includes('masala')}
              onChange={(event) =>
                setValue(
                  'product_categories_supplied',
                  event.target.checked
                    ? Array.from(new Set([...categories, 'masala']))
                    : categories.filter((item) => item !== 'masala'),
                )
              }
            />
            Masala
          </label>
          <div className="md:col-span-3 grid gap-2 rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm text-[#4A6358]">
            <p className="font-medium text-[#1B2E22]">Products supplied</p>
            <div className="grid gap-2 md:grid-cols-3">
              {(productsQuery.data ?? []).map((product) => (
                <label className="flex items-center gap-2" key={product.id}>
                  <input
                    type="checkbox"
                    checked={productIds.includes(String(product.id))}
                    onChange={(event) =>
                      setValue(
                        'product_ids',
                        event.target.checked
                          ? Array.from(new Set([...productIds, String(product.id)]))
                          : productIds.filter((id) => id !== String(product.id)),
                      )
                    }
                  />
                  {product.name}
                </label>
              ))}
            </div>
          </div>
          <Button disabled={isSubmitting} type="submit">
            {editingId ? 'Update Vendor' : 'Create Vendor'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3">
          <Input placeholder="Search vendors" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <DataTable
          columns={columns}
          data={query.data ?? []}
          emptyMessage="No vendors found."
          getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
        />
      </Card>
    </div>
  )
}
