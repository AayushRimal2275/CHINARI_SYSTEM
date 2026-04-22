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
  unit: string
  price_per_unit: string
  is_active: boolean
  deleted_at: string | null
}
