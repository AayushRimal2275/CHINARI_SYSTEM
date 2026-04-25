import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/useAuth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@chinari.local',
      password: 'password123',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch {
      toast.error('Login failed. Please check your credentials.')
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF8] p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Admin Login</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Input type="email" placeholder="Email" {...register('email')} />
            {errors.email ? <p className="mt-1 text-xs text-[#D64045]">{errors.email.message}</p> : null}
          </div>
          <div>
            <Input type="password" placeholder="Password" {...register('password')} />
            {errors.password ? <p className="mt-1 text-xs text-[#D64045]">{errors.password.message}</p> : null}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
