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
import { type ApiEnvelope, type Product } from '@/types/api'

type ProductPayload = { items: Product[] }

const numericString = z
  .string()
  .min(1, 'Required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Enter a valid number')

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['tea', 'masala']),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  price: numericString,
  status: z.enum(['active', 'inactive']),
  image: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
})

type ProductForm = z.infer<typeof productSchema>

const defaultForm: ProductForm = {
  name: '',
  category: 'tea',
  description: '',
  unit: '',
  price: '',
  status: 'active',
  image: '',
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultForm,
  })

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
    mutationFn: async (values: ProductForm) => {
      const payload = {
        ...values,
        price: Number(values.price),
        description: values.description || null,
        image: values.image || null,
      }
      if (editingId) {
        await api.put(`/products/${editingId}`, payload)
      } else {
        await api.post('/products', payload)
      }
    },
    onSuccess: async () => {
      reset(defaultForm)
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(editingId ? 'Product updated.' : 'Product created.')
    },
    onError: () => {
      toast.error('Unable to save product.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/products/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted.')
    },
    onError: () => toast.error('Unable to delete product.'),
  })

  const rows = useMemo(() => query.data ?? [], [query.data])

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      {
        header: 'Category',
        accessorKey: 'category',
        cell: (info) => <span className="capitalize">{info.getValue<string>()}</span>,
      },
      { header: 'Unit', accessorKey: 'unit' },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: (info) => <span className="font-data">Rs {info.getValue<string>()}</span>,
      },
      {
        header: 'Image',
        accessorKey: 'image',
        cell: (info) => {
          const url = info.getValue<string | null>()
          return url ? (
            <a className="text-[#40916C] underline" href={url} rel="noreferrer" target="_blank">
              View
            </a>
          ) : (
            '-'
          )
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
          const product = row.original
          return (
            <div className="flex gap-2">
              <Button
                className="bg-[#40916C] hover:bg-[#2D6A4F]"
                onClick={() => {
                  setEditingId(product.id)
                  reset({
                    name: product.name,
                    category: product.category,
                    description: product.description ?? '',
                    unit: product.unit,
                    price: product.price,
                    status: product.status,
                    image: product.image ?? '',
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
            <Input placeholder="Product name" {...register('name')} />
            {errors.name ? <p className="mt-1 text-xs text-[#D64045]">{errors.name.message}</p> : null}
          </div>
          <select
            className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
            {...register('category')}
          >
            <option value="tea">Tea</option>
            <option value="masala">Masala</option>
          </select>
          <div>
            <Input placeholder="Unit (kg, packet...)" {...register('unit')} />
            {errors.unit ? <p className="mt-1 text-xs text-[#D64045]">{errors.unit.message}</p> : null}
          </div>
          <div>
            <Input placeholder="Price" type="number" {...register('price')} />
            {errors.price ? <p className="mt-1 text-xs text-[#D64045]">{errors.price.message}</p> : null}
          </div>
          <select
            className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
            {...register('status')}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Input placeholder="Image URL (optional)" {...register('image')} />
          <Button disabled={isSubmitting} type="submit">
            {editingId ? 'Update Product' : 'Create Product'}
          </Button>
          <textarea
            className="md:col-span-3 rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm"
            placeholder="Description"
            rows={2}
            {...register('description')}
          />
          {errors.description ? <p className="md:col-span-3 text-xs text-[#D64045]">{errors.description.message}</p> : null}
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

        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="No products found."
          getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
        />
      </Card>
    </div>
  )
}
