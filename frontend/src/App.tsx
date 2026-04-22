import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/features/auth/useAuth'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProductsPage } from '@/pages/ProductsPage'

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
        <Route element={<PlaceholderPage title="Vendors" />} path="vendors" />
        <Route element={<PlaceholderPage title="Inventory" />} path="inventory" />
        <Route element={<PlaceholderPage title="Sales" />} path="sales" />
        <Route element={<PlaceholderPage title="Payments" />} path="payments" />
      </Route>
    </Routes>
  )
}

export default function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route element={token ? <Navigate replace to="/" /> : <LoginPage />} path="/login" />
      <Route element={<ProtectedRoutes />} path="*" />
    </Routes>
  )
}
