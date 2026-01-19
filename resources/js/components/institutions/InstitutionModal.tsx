import { useState, useEffect } from 'react'
import { Institution } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Upload, X, Mail, Phone, MapPin } from 'lucide-react'

interface InstitutionModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: FormData) => Promise<void>
    institution?: Institution | null
}

export default function InstitutionModal({ isOpen, onClose, onSubmit, institution }: InstitutionModalProps) {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Philippines',
        status: 'active',
        logo: null as File | null,
    })

    useEffect(() => {
        if (institution) {
            setFormData({
                name: institution.name,
                email: institution.email,
                phone: institution.phone || '',
                address: institution.address || '',
                city: institution.city || '',
                country: institution.country || 'Philippines',
                status: institution.status,
                logo: null,
            })

            if (institution.logo) {
                setLogoPreview(`/storage/${institution.logo}`)
            }
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: 'Philippines',
                status: 'active',
                logo: null,
            })
            setLogoPreview(null)
        }
        setErrors({})
    }, [institution, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null })
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormData({ ...formData, logo: file })
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeLogo = () => {
        setFormData({ ...formData, logo: null })
        setLogoPreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const submitData = new FormData()
            submitData.append('name', formData.name)
            submitData.append('email', formData.email)
            submitData.append('phone', formData.phone)
            submitData.append('address', formData.address)
            submitData.append('city', formData.city)
            submitData.append('country', formData.country)
            submitData.append('status', formData.status)
            if (formData.logo) {
                submitData.append('logo', formData.logo)
            }
            if (institution) {
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
            title={institution ? 'Edit Institution' : 'Create Institution'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <label className="label">Institution Logo</label>
                    <div className="space-y-3">
                        {logoPreview ? (
                            <div className="relative">
                                <img
                                    src={logoPreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-lg mx-auto"
                                />
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="absolute top-2 right-2 p-2 bg-danger text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-bg-hover hover:bg-bg-card transition-colors">
                                <div className="flex flex-col items-center justify-center">
                                    <Upload className="h-8 w-8 text-text-muted mb-2" />
                                    <p className="text-sm text-text-secondary">Upload logo</p>
                                    <p className="text-xs text-text-muted">PNG, JPG up to 2MB</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                            </label>
                        )}
                    </div>
                    {errors.logo && (
                        <p className="mt-1 text-sm text-danger">{errors.logo[0]}</p>
                    )}
                </div>

                <Input
                    label="Institution Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name?.[0]}
                    placeholder="e.g., Ateneo De Naga University"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email?.[0]}
                        icon={<Mail className="h-5 w-5" />}
                        placeholder="info@institution.edu"
                        required
                    />

                    <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone?.[0]}
                        icon={<Phone className="h-5 w-5" />}
                        placeholder="+63 912 345 6789"
                    />
                </div>

                <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address?.[0]}
                    icon={<MapPin className="h-5 w-5" />}
                    placeholder="Street address"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        error={errors.city?.[0]}
                        placeholder="Naga City"
                    />

                    <Input
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        error={errors.country?.[0]}
                        placeholder="Philippines"
                    />
                </div>

                <div>
                    <label className="label">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    {errors.status && (
                        <p className="mt-1 text-sm text-danger">{errors.status[0]}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        {institution ? 'Update Institution' : 'Create Institution'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}