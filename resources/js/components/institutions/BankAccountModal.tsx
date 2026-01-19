import { useState, useEffect } from 'react'
import { CreditCard, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BankAccount } from '@/types'

interface BankAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: Partial<BankAccount>) => Promise<void>
    bankAccount?: BankAccount | null
    institutionId: number
    committeeId?: number
}

export default function BankAccountModal({
    isOpen,
    onClose,
    onSubmit,
    bankAccount,
    institutionId,
    committeeId
}: BankAccountModalProps) {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState<Partial<BankAccount>>({
        bank_name: '',
        account_number: '',
        account_holder: '',
        swift_code: '',
        branch: '',
        is_primary: false,
        status: 'active',
        effective_from: new Date().toISOString().split('T')[0],
        effective_until: '',
    })

    useEffect(() => {
        if (bankAccount) {
            setFormData({
                bank_name: bankAccount.bank_name || '',
                account_number: bankAccount.account_number || '',
                account_holder: bankAccount.account_holder || '',
                swift_code: bankAccount.swift_code || '',
                branch: bankAccount.branch || '',
                is_primary: bankAccount.is_primary || false,
                status: bankAccount.status || 'active',
                effective_from: bankAccount.effective_from || new Date().toISOString().split('T')[0],
                effective_until: bankAccount.effective_until || '',
            })
        } else {
            setFormData({
                bank_name: '',
                account_number: '',
                account_holder: '',
                swift_code: '',
                branch: '',
                is_primary: false,
                status: 'active',
                effective_from: new Date().toISOString().split('T')[0],
                effective_until: '',
            })
        }
        setErrors({})
    }, [bankAccount, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.bank_name?.trim()) {
            newErrors.bank_name = 'Bank name is required'
        }

        if (!formData.account_number?.trim()) {
            newErrors.account_number = 'Account number is required'
        }

        if (!formData.account_holder?.trim()) {
            newErrors.account_holder = 'Account holder name is required'
        }

        if (!formData.effective_from) {
            newErrors.effective_from = 'Effective from date is required'
        }

        if (formData.effective_until && formData.effective_from) {
            const from = new Date(formData.effective_from)
            const until = new Date(formData.effective_until)
            if (until <= from) {
                newErrors.effective_until = 'End date must be after start date'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            return
        }

        setLoading(true)
        try {
            await onSubmit({
                ...formData,
                institution_id: institutionId,
                committee_id: committeeId || formData.committee_id,
            })
            onClose()
        } catch (error: any) {
            console.error('Failed to save bank account:', error)
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={bankAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Bank Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Bank Name"
                                name="bank_name"
                                value={formData.bank_name}
                                onChange={handleChange}
                                error={errors.bank_name}
                                required
                                placeholder="Enter bank name"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                label="Account Holder Name"
                                name="account_holder"
                                value={formData.account_holder}
                                onChange={handleChange}
                                error={errors.account_holder}
                                required
                                placeholder="Name as it appears on the account"
                            />
                        </div>

                        <Input
                            label="Account Number"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            error={errors.account_number}
                            required
                            placeholder="Enter account number"
                        />

                        <Input
                            label="Branch"
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            error={errors.branch}
                            placeholder="Branch name or code (optional)"
                        />

                        <div className="md:col-span-2">
                            <Input
                                label="SWIFT Code"
                                name="swift_code"
                                value={formData.swift_code}
                                onChange={handleChange}
                                error={errors.swift_code}
                                placeholder="SWIFT/BIC code (optional)"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Account Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Effective From"
                            name="effective_from"
                            value={formData.effective_from}
                            onChange={handleChange}
                            error={errors.effective_from}
                            required
                        />

                        <Input
                            type="date"
                            label="Effective Until"
                            name="effective_until"
                            value={formData.effective_until}
                            onChange={handleChange}
                            error={errors.effective_until}
                            placeholder="Leave empty for no end date"
                        />

                        <div>
                            <label className="label">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {errors.status && (
                                <p className="text-danger text-sm mt-1">{errors.status}</p>
                            )}
                        </div>

                        <div className="flex items-center pt-7">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_primary"
                                    checked={formData.is_primary}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-text-primary">Set as primary account</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-info/10 border border-info/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-text-secondary">
                        <p className="font-medium text-text-primary mb-1">Important Information</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Bank account details will be used for withdrawal processing</li>
                            <li>Ensure all information is accurate to avoid payment delays</li>
                            <li>Only one account can be set as primary at a time</li>
                            <li>Inactive accounts cannot be used for withdrawals</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        className="flex items-center gap-2"
                    >
                        <CreditCard className="h-4 w-4" />
                        {bankAccount ? 'Update Account' : 'Add Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}