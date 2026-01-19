import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, Heart, Users, Settings, LogOut, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
}

export default function Sidebar() {
    const location = useLocation()
    const { user, logout } = useAuth()

    const navigation: NavItem[] = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Institutions', href: '/admin/institutions', icon: Building2 },
        { name: 'Campaigns', href: '/admin/campaigns', icon: Target },
        { name: 'Donations', href: '/admin/donations', icon: Heart },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Settings', href: '/admin/profile', icon: Settings },
    ]
    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === path
        }
        return location.pathname.startsWith(path)
    }

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar-bg border-r border-border flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <h1 className="text-xl font-bold text-primary">Batchmates</h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                                ${active
                                    ? 'bg-sidebar-active text-white font-medium'
                                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                                }
                            `}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                            {user?.name}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}