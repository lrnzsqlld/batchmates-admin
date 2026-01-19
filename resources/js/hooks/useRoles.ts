import { useState, useEffect } from 'react'
import api from '@/components/helpers/api'
import { Role } from '@/types'

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchRoles = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get('/roles')
            setRoles(response.data.data)
            return response.data.data
        } catch (err) {
            setError(err as Error)
            console.error('Failed to fetch roles:', err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    return { roles, loading, error, refetch: fetchRoles }
}