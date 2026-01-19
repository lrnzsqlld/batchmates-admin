import { useState, useEffect } from 'react'
import api from '@/components/helpers/api'

interface Donation {
    id: number
    campaign_id: number
    donor_id?: number
    donor_name?: string
    donor_email?: string
    donor_display_name?: string
    amount: number | string
    payment_method: string
    status: string
    is_anonymous: boolean
    created_at: string
    campaign?: {
        id: number
        title: string
    }
}

interface UseDonationsOptions {
    search?: string
    status?: string
    campaign_id?: number
    institution_id?: number
    donor_id?: number
    per_page?: number
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export function useDonations(options: UseDonationsOptions = {}) {
    const [donations, setDonations] = useState<Donation[]>([])
    const [stats, setStats] = useState({
        total_donations: 0,
        total_count: 0,
        pending_count: 0,
        this_month: 0,
    })
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
                if (!params[key] || params[key] === 'all') {
                    delete params[key]
                }
            })

            const response = await api.get('/donations', { params })
            const data = response.data.data

            setDonations(data.data || [])
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
            })
            return data.data || []
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch donations:', err)
            setDonations([])
            throw err
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/donations/stats')
            setStats(response.data.data)
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        }
    }

    useEffect(() => {
        fetchDonations()
        fetchStats()
    }, [options.search, options.status, options.campaign_id, options.per_page])

    const deleteDonation = async (id: number) => {
        await api.delete(`/donations/${id}`)
        setDonations(donations.filter(d => d.id !== id))
        fetchStats()
    }

    const updateDonationStatus = async (id: number, status: string) => {
        await api.put(`/donations/${id}`, { status })
        await fetchDonations()
        await fetchStats()
    }

    return { 
        donations, 
        stats, 
        loading, 
        error, 
        pagination,
        refetch: fetchDonations, 
        deleteDonation,
        updateDonationStatus 
    }
}

export function useCampaignDonations(options: UseDonationsOptions = {}) {
    return useDonations(options)
}

export function useDonation(id: string | number) {
    const [donation, setDonation] = useState<Donation | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchDonation = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/donations/${id}`)
            const data = response.data.data
            setDonation(data)
            return data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch donation:', err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchDonation()
        }
    }, [id])

    return { donation, loading, error, refetch: fetchDonation }
}