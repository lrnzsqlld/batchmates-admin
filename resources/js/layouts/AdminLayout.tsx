import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, Users, Building2, GraduationCap, Heart, LogOut } from 'lucide-react'

export default function AdminLayout() {
    const { user, logout, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        )
    }

    if (!user || !user.roles.some((role: any) => role.name === 'admin')) {
        return <Navigate to="/login" replace />
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Institutions', href: '/admin/institutions', icon: Building2 },
        { name: 'Students', href: '/admin/students', icon: GraduationCap },
        { name: 'Donations', href: '/admin/donations', icon: Heart },
    ]

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
                <div className="flex flex-col h-full">
                    <div className="flex items-center h-16 px-6 border-b">
                        <h1 className="text-xl font-bold text-blue-600">Batchmates Admin</h1>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition"
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-600 hover:text-red-600 transition"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pl-64">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}