import { useState, useEffect } from 'react'
import { User } from '@/types'
import api from '@/components/helpers/api'

interface UseUsersOptions {
    search?: string
    role?: string
    status?: string
    per_page?: number
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export function useUsers(options: UseUsersOptions = {}) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    })

    const fetchUsers = async (page: number = 1) => {
        setLoading(true)
        setError(null)

        try {
            const params: any = { ...options, page }
            
            Object.keys(params).forEach(key => {
                if (!params[key] || params[key] === 'all') {
                    delete params[key]
                }
            })

            const response = await api.get('/users', { params })
            const data = response.data.data

            setUsers(data.data || [])
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
            })
            return data.data || []
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch users:', err)
            setUsers([])
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [options.search, options.role, options.status, options.per_page])

    const deleteUser = async (id: number) => {
        await api.delete(`/users/${id}`)
        setUsers(users.filter(u => u.id !== id))
    }

    const updateUser = async (id: number, data: Partial<User>) => {
        const response = await api.put(`/users/${id}`, data)
        const updatedUser = response.data.data
        setUsers(users.map(u => u.id === id ? updatedUser : u))
        return updatedUser
    }

    return { 
        users, 
        loading, 
        error, 
        pagination,
        refetch: fetchUsers, 
        deleteUser, 
        updateUser 
    }
}

export function useUser(id: string | number) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchUser = async () => {
        if (!id) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/users/${id}`)
            const data = response.data.data
            setUser(data)
            return data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch user:', err)
            setUser(null)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [id])

    const updateUser = async (data: Record<string, any>) => {
        const response = await api.put(`/users/${id}`, data)
        const updatedUser = response.data.data
        setUser(updatedUser)
        return updatedUser
    }

    return { user, loading, error, refetch: fetchUser, updateUser }
}