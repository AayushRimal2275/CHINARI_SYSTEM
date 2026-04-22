import { Card } from '@/components/ui/card'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card>
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="text-sm text-slate-600">This module shell is ready for the next phase implementation.</p>
    </Card>
  )
}
