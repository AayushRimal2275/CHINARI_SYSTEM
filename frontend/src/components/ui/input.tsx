import { type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-[#C7E4CE] bg-white px-3 py-2 text-sm text-[#1B2E22] outline-none ring-[#D8F3DC] transition focus:ring-2',
        className,
      )}
      {...props}
    />
  )
}
