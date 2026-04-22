import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Vendors', path: '/vendors' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Sales', path: '/sales' },
  { label: 'Payments', path: '/payments' },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <h1 className="mb-4 text-lg font-bold">CHINARI SYSTEM</h1>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100',
                  location.pathname === item.path && 'bg-slate-900 text-white hover:bg-slate-900',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-4 md:p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="font-medium text-slate-800">{user?.email}</p>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-500"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              Logout
            </Button>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
