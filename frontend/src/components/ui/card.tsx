import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border border-[#C7E4CE] bg-white p-4 shadow-sm shadow-[#D8F3DC]/50', className)}>{children}</div>
}
