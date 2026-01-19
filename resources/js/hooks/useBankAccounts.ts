import { useState, useEffect } from 'react'
import api from '@/components/helpers/api'
import { BankAccount } from '@/types'

interface UseBankAccountsOptions {
    institution_id?: number
    committee_id?: number
    status?: 'active' | 'inactive' | 'all'
}

export function useBankAccounts(options: UseBankAccountsOptions = {}) {
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchBankAccounts = async () => {
        setLoading(true)
        setError(null)

        try {
            const searchParams: any = { ...options }
            
            Object.keys(searchParams).forEach(key => {
                if (!searchParams[key] || searchParams[key] === 'all') {
                    delete searchParams[key]
                }
            })

            const response = await api.get('/committee-bank-accounts', { params: searchParams })
            const data = response.data.data || []
            setBankAccounts(data)
            
            return data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch bank accounts:', err)
            setBankAccounts([])
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (options.institution_id || options.committee_id) {
            fetchBankAccounts()
        }
    }, [options.institution_id, options.committee_id, options.status])

    const createBankAccount = async (data: Partial<BankAccount>) => {
        const response = await api.post('/committee-bank-accounts', data)
        const newAccount = response.data.data
        setBankAccounts([...bankAccounts, newAccount])
        return newAccount
    }

    const updateBankAccount = async (id: number, data: Partial<BankAccount>) => {
        const response = await api.put(`/committee-bank-accounts/${id}`, data)
        const updatedAccount = response.data.data
        setBankAccounts(bankAccounts.map(acc => acc.id === id ? updatedAccount : acc))
        return updatedAccount
    }

    const deleteBankAccount = async (id: number) => {
        await api.delete(`/committee-bank-accounts/${id}`)
        setBankAccounts(bankAccounts.filter(acc => acc.id !== id))
    }

    const setPrimaryAccount = async (id: number) => {
        const response = await api.post(`/committee-bank-accounts/${id}/set-primary`)
        const updatedAccounts = response.data.data
        setBankAccounts(updatedAccounts)
        return updatedAccounts
    }

    return { 
        bankAccounts, 
        loading, 
        error, 
        refetch: fetchBankAccounts,
        createBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setPrimaryAccount,
    }
}

export function useBankAccount(id: string | number) {
    const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchBankAccount = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.get(`/committee-bank-accounts/${id}`)
            const data = response.data.data
            setBankAccount(data)
            return data
        } catch (err: any) {
            setError(err as Error)
            console.error('Failed to fetch bank account:', err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchBankAccount()
        }
    }, [id])

    return { bankAccount, loading, error, refetch: fetchBankAccount }
}