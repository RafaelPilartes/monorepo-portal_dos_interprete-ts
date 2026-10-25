import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NotFound from '@/pages/NotFound'
import RecoverPassword from '@/pages/portal/auth/RecoverPassword'
import Register from '@/pages/portal/auth/Register'
import AdminRoutes from './AdminRoutes'
import InterpreterRoutes from './InterpreterRoutes'
import RequesterRoutes from './RequesterRoutes'
import PublicRoutes from './PublicRoutes'
import Login from '@/pages/portal/auth/Login'

const AppRoutes = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Public Routes */}
        {PublicRoutes()}

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover-password" element={<RecoverPassword />} />

        {/* Requester Dashboard Routes */}
        {RequesterRoutes()}

        {/* Interpreter Dashboard Routes */}
        {InterpreterRoutes()}

        {/* Admin Dashboard Routes */}
        {AdminRoutes()}

        {/* Legacy redirects */}
        <Route path="/*" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
