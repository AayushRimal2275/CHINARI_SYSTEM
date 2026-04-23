import { Toaster } from 'react-hot-toast'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/features/auth/useAuth'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { SalesPage } from '@/pages/SalesPage'
import { VendorsPage } from '@/pages/VendorsPage'

function ProtectedRoutes() {
  const { token } = useAuth()

  if (!token) {
    return <Navigate replace to="/login" />
  }

  return (
    <Routes>
        <Route element={<AppShell />} path="/">
          <Route element={<DashboardPage />} index />
          <Route element={<ProductsPage />} path="products" />
          <Route element={<VendorsPage />} path="vendors" />
          <Route element={<InventoryPage />} path="inventory" />
          <Route element={<SalesPage />} path="sales" />
          <Route element={<PaymentsPage />} path="payments" />
        </Route>
    </Routes>
  )
}

export default function App() {
  const { token } = useAuth()

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route element={token ? <Navigate replace to="/" /> : <LoginPage />} path="/login" />
        <Route element={<ProtectedRoutes />} path="*" />
      </Routes>
    </>
  )
}
