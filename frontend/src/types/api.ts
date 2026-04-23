export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
  meta: unknown
}

export type Product = {
  id: number
  name: string
  category: 'tea' | 'masala'
  description: string | null
  unit: string
  image: string | null
  price: string
  price_per_unit: string
  status: 'active' | 'inactive'
  is_active: boolean
  inventory?: {
    quantity_in_stock: string
    reorder_level: string
    is_low_stock: boolean
  } | null
  deleted_at: string | null
}

export type Vendor = {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  product_categories_supplied: string[]
  status: 'active' | 'inactive'
}

export type Inventory = {
  id: number
  product_id: number
  product: Product
  quantity_in_stock: string
  reorder_level: string
  is_low_stock: boolean
  last_updated: string | null
}

export type StockMovement = {
  id: number
  product_id: number
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: string
  note: string | null
  date: string
}

export type SaleItem = {
  id: number
  product_id: number
  product_name: string
  quantity: string
  unit_price: string
  subtotal: string
}

export type Sale = {
  id: number
  sale_number: string
  customer_name: string
  customer_phone: string | null
  sale_date: string
  total_amount: string
  payment_status: 'unpaid' | 'partial' | 'paid'
  notes: string | null
  items?: SaleItem[]
}

export type Payment = {
  id: number
  sale_id: number
  amount_paid: string
  payment_method: 'cash' | 'esewa' | 'bank'
  payment_date: string
  notes: string | null
  sale?: Sale
}
