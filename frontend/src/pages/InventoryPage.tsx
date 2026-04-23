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
import { type ApiEnvelope, type Inventory, type Product, type StockMovement } from '@/types/api'

type InventoryPayload = { items: Inventory[] }
type ProductsPayload = { items: Product[] }
type MovementPayload = { movements: StockMovement[] }

const numericString = z
  .string()
  .min(1, 'Required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Enter a valid number')

const movementSchema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  movement_type: z.enum(['in', 'out']),
  quantity: numericString,
  note: z.string().optional(),
})

const reorderSchema = z.object({
  reorder_level: numericString,
})

type MovementForm = z.infer<typeof movementSchema>
type ReorderForm = z.infer<typeof reorderSchema>

const defaultForm: MovementForm = {
  product_id: '',
  movement_type: 'in',
  quantity: '',
  note: '',
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null)
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: defaultForm,
  })
  const {
    register: registerReorder,
    handleSubmit: handleReorderSubmit,
    reset: resetReorder,
    formState: { errors: reorderErrors, isSubmitting: isReorderSubmitting },
  } = useForm<ReorderForm>({
    resolver: zodResolver(reorderSchema),
    defaultValues: { reorder_level: '' },
  })

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
    mutationFn: async (values: MovementForm) => {
      await api.post('/inventory/adjust', {
        product_id: Number(values.product_id),
        movement_type: values.movement_type,
        quantity: Number(values.quantity),
        note: values.note,
      })
    },
    onSuccess: async () => {
      reset(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Inventory updated.')
    },
    onError: () => toast.error('Unable to update inventory.'),
  })

  const reorderMutation = useMutation({
    mutationFn: async (values: ReorderForm) => {
      if (!editingInventory) {
        return
      }
      await api.put(`/inventory/${editingInventory.id}`, {
        reorder_level: Number(values.reorder_level),
      })
    },
    onSuccess: async () => {
      setEditingInventory(null)
      resetReorder({ reorder_level: '' })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Reorder level updated.')
    },
    onError: () => toast.error('Unable to update reorder level.'),
  })

  const columns = useMemo<ColumnDef<Inventory>[]>(
    () => [
      {
        header: 'Product',
        cell: ({ row }) => row.original.product?.name,
      },
      {
        header: 'In Stock',
        accessorKey: 'quantity_in_stock',
        cell: (info) => <span className="font-data">{info.getValue<string>()}</span>,
      },
      {
        header: 'Reorder Level',
        accessorKey: 'reorder_level',
        cell: (info) => <span className="font-data">{info.getValue<string>()}</span>,
      },
      {
        header: 'Alert',
        cell: ({ row }) =>
          row.original.is_low_stock ? <Badge className="bg-[#FCECC6] text-[#E9A825]">Low stock</Badge> : <Badge>In stock</Badge>,
      },
      {
        header: 'History',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button className="bg-[#40916C] hover:bg-[#2D6A4F]" onClick={() => setSelectedInventoryId(row.original.id)} type="button">
              View
            </Button>
            <Button
              className="border border-[#40916C] bg-white text-[#40916C] hover:bg-[#D8F3DC]"
              onClick={() => {
                setEditingInventory(row.original)
                resetReorder({ reorder_level: row.original.reorder_level })
              }}
              type="button"
            >
              Edit Reorder
            </Button>
          </div>
        ),
      },
    ],
    [resetReorder],
  )

  const onSubmit = handleSubmit((values) => mutation.mutate(values))
  const onReorderSubmit = handleReorderSubmit((values) => reorderMutation.mutate(values))

  return (
    <div className="space-y-4">
      <Card>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
          <div>
            <select className="w-full rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" {...register('product_id')}>
            <option value="">Select product</option>
            {(productsQuery.data ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
            {errors.product_id ? <p className="mt-1 text-xs text-[#D64045]">{errors.product_id.message}</p> : null}
          </div>
          <select className="rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm" {...register('movement_type')}>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
          <div>
            <Input placeholder="Quantity" type="number" {...register('quantity')} />
            {errors.quantity ? <p className="mt-1 text-xs text-[#D64045]">{errors.quantity.message}</p> : null}
          </div>
          <Button disabled={isSubmitting} type="submit">
            Record Movement
          </Button>
          <Input className="md:col-span-4" placeholder="Note" {...register('note')} />
        </form>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={inventoryQuery.data ?? []}
          emptyMessage="No inventory records found."
          getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
        />
      </Card>

      {editingInventory ? (
        <Card>
          <h3 className="mb-3 text-lg">Update Reorder Level</h3>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onReorderSubmit}>
            <div className="md:col-span-2">
              <Input placeholder="Reorder level" type="number" {...registerReorder('reorder_level')} />
              {reorderErrors.reorder_level ? <p className="mt-1 text-xs text-[#D64045]">{reorderErrors.reorder_level.message}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button disabled={isReorderSubmitting} type="submit">
                Save
              </Button>
              <Button
                className="border border-[#40916C] bg-white text-[#40916C] hover:bg-[#D8F3DC]"
                onClick={() => {
                  setEditingInventory(null)
                  resetReorder({ reorder_level: '' })
                }}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {selectedInventoryId ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg">Movement History</h3>
            <Button
              className="border border-[#40916C] bg-white text-[#40916C] hover:bg-[#D8F3DC]"
              onClick={() => setSelectedInventoryId(null)}
              type="button"
            >
              Close
            </Button>
          </div>
          <DataTable
            columns={[
              {
                header: 'Type',
                accessorKey: 'movement_type',
                cell: (info) => <span className="uppercase">{info.getValue<string>()}</span>,
              },
              {
                header: 'Quantity',
                accessorKey: 'quantity',
                cell: (info) => <span className="font-data">{info.getValue<string>()}</span>,
              },
              {
                header: 'Note',
                accessorKey: 'note',
                cell: (info) => info.getValue<string>() || 'No note',
              },
              {
                header: 'Date',
                accessorKey: 'date',
                cell: (info) => new Date(info.getValue<string>()).toLocaleString(),
              },
            ]}
            data={movementQuery.data ?? []}
            emptyMessage="No movements recorded."
            getRowClassName={(_, index) => (index % 2 ? 'bg-white' : 'bg-[#F8FAF8]')}
          />
        </Card>
      ) : null}
    </div>
  )
}
