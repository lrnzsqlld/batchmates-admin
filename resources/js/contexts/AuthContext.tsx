import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
    id: number
    name: string
    email: string
    roles: any[]
    status: string
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const response = await axios.get('/auth/me')
            setUser(response.data.data)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        await axios.get('/sanctum/csrf-cookie')
        const response = await axios.post('/auth/login', { email, password })
        setUser(response.data.data.user)
    }

    const logout = async () => {
        try {
            await axios.post('/auth/logout')
        } finally {
            setUser(null)
            window.location.href = '/login'
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}