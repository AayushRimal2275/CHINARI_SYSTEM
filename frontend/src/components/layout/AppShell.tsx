import { CreditCard, LayoutDashboard, Package, ShoppingCart, Users, Warehouse } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Vendors', path: '/vendors', icon: Users },
  { label: 'Inventory', path: '/inventory', icon: Warehouse },
  { label: 'Sales', path: '/sales', icon: ShoppingCart },
  { label: 'Payments', path: '/payments', icon: CreditCard },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-r border-[#C7E4CE] bg-[#2D6A4F] p-4 text-white">
          <h1 className="mb-4 text-lg font-bold tracking-wide">CHINARI SYSTEM</h1>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm text-white hover:bg-[#40916C]',
                  location.pathname === item.path && 'bg-[#D8F3DC] text-[#1B2E22] hover:bg-[#D8F3DC]',
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-4 md:p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#C7E4CE] pb-3">
            <div>
              <p className="text-sm text-[#4A6358]">Signed in as</p>
              <p className="font-medium text-[#1B2E22]">{user?.email}</p>
            </div>
            <Button
              className="bg-[#D64045] hover:bg-[#b63035]"
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
