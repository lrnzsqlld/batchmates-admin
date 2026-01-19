import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/components/helpers/api'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<User> => {
    await api.get('http://localhost:8000/sanctum/csrf-cookie')
    const response = await api.post('/web/auth/login', { email, password })
    const userData = response.data.data
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.roles?.some(r => r.name === role) || false
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}