import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-[#2D6A4F] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#40916C] disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
