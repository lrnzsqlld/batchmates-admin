import { useState, useEffect } from 'react'
import { Institution, Campaign, Donation, User } from '@/types'
import api from '@/components/helpers/api'

interface UseInstitutionsOptions {
    search?: string
    status?: string
    per_page?: number
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export function useInstitutions(options: UseInstitutionsOptions = {}) {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    })

    const fetchInstitutions = async (page: number = 1) => {
        setLoading(true)
        setError(null)

        try {
            const params: any = { ...options, page }
            
            Object.keys(params).forEach(key => {
                if (!params[key]) {
                    delete params[key]
                }
            })

            const response = await api.get('/institutions', { params })
            const data = response.data.data

            setInstitutions(data.data || [])
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
            })
            return data.data || []
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch institutions:', err)
            setInstitutions([])
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInstitutions()
    }, [options.search, options.status, options.per_page])

    const deleteInstitution = async (id: number) => {
        await api.delete(`/institutions/${id}`)
        setInstitutions(institutions.filter(i => i.id !== id))
    }

    const updateInstitution = async (id: number, data: any) => {
        const response = await api.put(`/institutions/${id}`, data)
        setInstitutions(institutions.map(i => i.id === id ? response.data.data : i))
        return response.data.data
    }

    return { 
        institutions, 
        loading, 
        error, 
        pagination,
        refetch: fetchInstitutions,
        deleteInstitution,
        updateInstitution,
    }
}

export function useInstitution(id: string | number) {
    const [institution, setInstitution] = useState<Institution | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchInstitution = async () => {
        if (!id) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/institutions/${id}`)
            setInstitution(response.data.data)
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch institution:', err)
            setInstitution(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInstitution()
    }, [id])

    return { institution, loading, error, refetch: fetchInstitution }
}

interface InstitutionStats {
    total_campaigns: number
    active_campaigns: number
    total_raised: number
    total_users: number
    total_donations: number
}

export function useInstitutionDetails(id: string | number) {
    const [institution, setInstitution] = useState<Institution | null>(null)
    const [stats, setStats] = useState<InstitutionStats>({
        total_campaigns: 0,
        active_campaigns: 0,
        total_raised: 0,
        total_users: 0,
        total_donations: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchInstitutionDetails = async () => {
        if (!id) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const [institutionRes, statsRes] = await Promise.all([
                api.get(`/institutions/${id}`),
                api.get(`/institutions/${id}/stats`)
            ])

            setInstitution(institutionRes.data.data)
            setStats(statsRes.data.data)
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch institution details:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInstitutionDetails()
    }, [id])

    return { institution, stats, loading, error, refetch: fetchInstitutionDetails }
}

interface UseInstitutionCampaignsOptions {
    institution_id: number
    status?: string
    per_page?: number
}

export function useInstitutionCampaigns(options: UseInstitutionCampaignsOptions) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    })

    const fetchCampaigns = async (page: number = 1) => {
        setLoading(true)
        setError(null)

        try {
            const params: any = { ...options, page }
            
            Object.keys(params).forEach(key => {
                if (!params[key]) {
                    delete params[key]
                }
            })

            const response = await api.get('/campaigns', { params })
            const data = response.data.data

            setCampaigns(data.data || data || [])
            
            if (data.current_page) {
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                })
            }
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch institution campaigns:', err)
            setCampaigns([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (options.institution_id) {
            fetchCampaigns()
        }
    }, [options.institution_id, options.status, options.per_page])

    return { campaigns, loading, error, pagination, refetch: fetchCampaigns }
}

interface UseInstitutionDonationsOptions {
    institution_id: number
    status?: string
    per_page?: number
}

export function useInstitutionDonations(options: UseInstitutionDonationsOptions) {
    const [donations, setDonations] = useState<Donation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    })

    const fetchDonations = async (page: number = 1) => {
        setLoading(true)
        setError(null)

        try {
            const params: any = { ...options, page }
            
            Object.keys(params).forEach(key => {
                if (!params[key]) {
                    delete params[key]
                }
            })

            const response = await api.get('/donations', { params })
            const data = response.data.data

            setDonations(data.data || data || [])
            
            if (data.current_page) {
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                })
            }
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch institution donations:', err)
            setDonations([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (options.institution_id) {
            fetchDonations()
        }
    }, [options.institution_id, options.status, options.per_page])

    return { donations, loading, error, pagination, refetch: fetchDonations }
}

interface UseInstitutionUsersOptions {
    institution_id: number
    role?: string
    per_page?: number
}

export function useInstitutionUsers(options: UseInstitutionUsersOptions) {
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
                if (!params[key]) {
                    delete params[key]
                }
            })

            const response = await api.get('/users', { params })
            const data = response.data.data

            setUsers(data.data || data || [])
            
            if (data.current_page) {
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                })
            }
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch institution users:', err)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (options.institution_id) {
            fetchUsers()
        }
    }, [options.institution_id, options.role, options.per_page])

    return { users, loading, error, pagination, refetch: fetchUsers }
}