import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface GuestRouteProps {
    children: ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        )
    }

    if (user) {
        return <Navigate to="/admin" replace />
    }

    return <>{children}</>
}
