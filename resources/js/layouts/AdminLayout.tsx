import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/campaigns': 'Campaigns',
  '/admin/donations': 'Donations',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
}

export default function AdminLayout() {
  const location = useLocation()
  const { hasRole, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageTitle = pageTitles[location.pathname] || 'Admin Panel'

  if (!hasRole('system_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg-main">
        <div className="max-w-md w-full">
          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-danger" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h2>
            <p className="text-text-secondary mb-6">
              You don't have the required permissions to access the admin panel.
            </p>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      <div className="lg:pl-64">
        <Header title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}