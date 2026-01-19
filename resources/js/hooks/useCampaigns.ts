import { useState, useEffect } from 'react'
import { Campaign } from '@/types'
import api from '@/components/helpers/api'

interface UseCampaignsOptions {
    search?: string
    status?: string
    institution_id?: number
    per_page?: number
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export function useCampaigns(options: UseCampaignsOptions = {}) {
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
            const searchParams: any = { ...options, page }
            
            Object.keys(searchParams).forEach(key => {
                if (!searchParams[key] || searchParams[key] === 'all') {
                    delete searchParams[key]
                }
            })

            const response = await api.get('/campaigns', { params: searchParams })
            const responseData = response.data.data
            
            // Handle both paginated and non-paginated responses
            const data = responseData.data || responseData || []
            setCampaigns(data)
            
            // Set pagination if available
            if (responseData.current_page) {
                setPagination({
                    current_page: responseData.current_page,
                    last_page: responseData.last_page,
                    per_page: responseData.per_page,
                    total: responseData.total,
                })
            }
            
            return data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch campaigns:', err)
            setCampaigns([])
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCampaigns()
    }, [options.search, options.status, options.institution_id, options.per_page])

    const deleteCampaign = async (id: number) => {
        await api.delete(`/campaigns/${id}`)
        setCampaigns(campaigns.filter(c => c.id !== id))
    }

    const updateCampaign = async (id: number, data: Partial<Campaign>) => {
        const response = await api.put(`/campaigns/${id}`, data)
        const updatedCampaign = response.data.data
        setCampaigns(campaigns.map(c => c.id === id ? updatedCampaign : c))
        return updatedCampaign
    }

    return { 
        campaigns, 
        loading, 
        error, 
        pagination,
        refetch: fetchCampaigns, 
        deleteCampaign,
        updateCampaign 
    }
}

export function useCampaign(id: string | number) {
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchCampaign = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/campaigns/${id}`)
            const data = response.data.data
            setCampaign(data)
            return data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch campaign:', err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchCampaign()
        }
    }, [id])

    const updateCampaign = async (data: Partial<Campaign>) => {
        const response = await api.put(`/campaigns/${id}`, data)
        const updatedCampaign = response.data.data
        setCampaign(updatedCampaign)
        return updatedCampaign
    }

    return { campaign, loading, error, refetch: fetchCampaign, updateCampaign }
}

export function useCampaignStats() {
    const [stats, setStats] = useState({
        total_campaigns: 0,
        active_campaigns: 0,
        total_raised: 0,
        total_goal: 0,
        total_donors: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchStats = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get('/campaignStats')
            setStats(response.data.data)
            return response.data.data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch campaign stats:', err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    return { stats, loading, error, refetch: fetchStats }
}