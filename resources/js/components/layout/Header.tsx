import { Menu, Bell, Search } from 'lucide-react'

interface HeaderProps {
    title: string
    onMenuClick?: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 bg-bg-main border-b border-border">
            <div className="flex items-center justify-between h-16 px-6">
                <div className="flex items-center gap-4">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    )}
                    <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors">
                        <Search className="h-5 w-5" />
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 h-2 w-2 bg-danger rounded-full"></span>
                    </button>
                </div>
            </div>
        </header>
    )
}