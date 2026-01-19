import { useState, useEffect } from 'react'
import { Campaign } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Upload, X, Building2, CreditCard } from 'lucide-react'
import { useInstitutions } from '@/hooks/useInstitutions'
import { useBankAccounts } from '@/hooks/useBankAccounts'

interface CampaignModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: FormData) => Promise<void>
    campaign?: Campaign | null
}

export default function CampaignModal({ isOpen, onClose, onSubmit, campaign }: CampaignModalProps) {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null)

    const { institutions } = useInstitutions({ status: 'active' })
    const { bankAccounts, loading: bankAccountsLoading } = useBankAccounts({
        institution_id: selectedInstitutionId || undefined,
        status: 'active'
    })

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        campaign_type: 'general',
        goal_amount: '',
        institution_id: '',
        bank_account_id: '',
        beneficiary_id: '',
        priority: 'normal',
        end_date: '',
        image: null as File | null,
    })

    useEffect(() => {
        if (campaign) {
            const endDate = campaign.end_date
                ? new Date(campaign.end_date).toISOString().split('T')[0]
                : ''

            setFormData({
                title: campaign.title,
                description: campaign.description,
                campaign_type: campaign.campaign_type,
                goal_amount: campaign.goal_amount.toString(),
                institution_id: campaign.institution_id?.toString() || '',
                bank_account_id: campaign.bank_account_id?.toString() || '',
                beneficiary_id: campaign.beneficiary_id?.toString() || '',
                priority: campaign.priority,
                end_date: endDate,
                image: null,
            })

            if (campaign.institution_id) {
                setSelectedInstitutionId(campaign.institution_id)
            }

            if (campaign.image) {
                setImagePreview(`/storage/${campaign.image}`)
            }
        } else {
            setFormData({
                title: '',
                description: '',
                campaign_type: 'general',
                goal_amount: '',
                institution_id: '',
                bank_account_id: '',
                beneficiary_id: '',
                priority: 'normal',
                end_date: '',
                image: null,
            })
            setImagePreview(null)
            setSelectedInstitutionId(null)
        }
        setErrors({})
    }, [campaign, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        // If institution changes, reset bank account selection
        if (name === 'institution_id') {
            setSelectedInstitutionId(value ? parseInt(value) : null)
            setFormData(prev => ({
                ...prev,
                institution_id: value,
                bank_account_id: '' // Reset bank account when institution changes
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }))
        }

        if (errors[name]) {
            setErrors({ ...errors, [name]: null })
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormData({ ...formData, image: file })
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setFormData({ ...formData, image: null })
        setImagePreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const submitData = new FormData()
            submitData.append('title', formData.title)
            submitData.append('description', formData.description)
            submitData.append('campaign_type', formData.campaign_type)
            submitData.append('goal_amount', formData.goal_amount)
            submitData.append('institution_id', formData.institution_id)
            submitData.append('priority', formData.priority)

            if (formData.bank_account_id) {
                submitData.append('bank_account_id', formData.bank_account_id)
            }

            if (formData.beneficiary_id) {
                submitData.append('beneficiary_id', formData.beneficiary_id)
            }

            if (formData.end_date) {
                submitData.append('end_date', formData.end_date)
            }

            if (formData.image) {
                submitData.append('image', formData.image)
            }

            if (campaign) {
                submitData.append('_method', 'PUT')
            }

            await onSubmit(submitData)
            onClose()
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={campaign ? 'Edit Campaign' : 'Create Campaign'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <label className="label">Campaign Image</label>
                    <div className="space-y-3">
                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-2 bg-danger text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-bg-hover hover:bg-bg-card transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="h-10 w-10 text-text-muted mb-3" />
                                    <p className="mb-2 text-sm text-text-secondary">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-text-muted">PNG, JPG, GIF up to 5MB</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
                    </div>
                    {errors.image && (
                        <p className="mt-1 text-sm text-danger">{errors.image[0]}</p>
                    )}
                </div>

                <Input
                    label="Campaign Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    error={errors.title?.[0]}
                    placeholder="e.g., Medical Assistance for Juan"
                    required
                />

                <div>
                    <label className="label flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Institution
                    </label>
                    <select
                        name="institution_id"
                        value={formData.institution_id}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="">Select institution</option>
                        {institutions.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                                {institution.name}
                            </option>
                        ))}
                    </select>
                    {errors.institution_id && (
                        <p className="mt-1 text-sm text-danger">{errors.institution_id[0]}</p>
                    )}
                </div>

                <div>
                    <label className="label flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Bank Account (Optional)
                    </label>
                    <select
                        name="bank_account_id"
                        value={formData.bank_account_id}
                        onChange={handleChange}
                        className="input"
                        disabled={!selectedInstitutionId || bankAccountsLoading}
                    >
                        <option value="">
                            {!selectedInstitutionId
                                ? 'Select institution first'
                                : bankAccountsLoading
                                    ? 'Loading...'
                                    : 'No bank account'}
                        </option>
                        {bankAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.bank_name} - {account.account_holder}
                                {account.is_primary && ' (Primary)'}
                            </option>
                        ))}
                    </select>
                    {errors.bank_account_id && (
                        <p className="mt-1 text-sm text-danger">{errors.bank_account_id[0]}</p>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                        Select where donations will be deposited
                    </p>
                </div>

                <div>
                    <label className="label">Campaign Type</label>
                    <select
                        name="campaign_type"
                        value={formData.campaign_type}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="general">General Campaign</option>
                        <option value="individual">Individual Campaign</option>
                    </select>
                    {errors.campaign_type && (
                        <p className="mt-1 text-sm text-danger">{errors.campaign_type[0]}</p>
                    )}
                </div>

                <div>
                    <label className="label">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input min-h-32"
                        placeholder="Describe the purpose of this campaign..."
                        required
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-danger">{errors.description[0]}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Goal Amount (₱)"
                        name="goal_amount"
                        type="number"
                        value={formData.goal_amount}
                        onChange={handleChange}
                        error={errors.goal_amount?.[0]}
                        placeholder="500000"
                        required
                        min="1"
                    />

                    <div>
                        <label className="label">Priority</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <Input
                    label="End Date (Optional)"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    error={errors.end_date?.[0]}
                    min={new Date().toISOString().split('T')[0]}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        {campaign ? 'Update Campaign' : 'Create Campaign'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}