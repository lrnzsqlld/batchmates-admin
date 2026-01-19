import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Mail, Phone, MapPin, Building2, Shield } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useRoles } from '@/hooks/useRoles'
import { useInstitutions } from '@/hooks/useInstitutions'
import api from '@/components/helpers/api'

export default function UserCreate() {
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const { roles } = useRoles()
    const { institutions } = useInstitutions({ status: 'active' })

    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        address: '',
        city: '',
        country: 'Philippines',
        institution_id: currentUser?.institution_id?.toString() || '',
        status: 'active',
        roles: [] as string[],
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null })
        }
    }

    const handleRoleChange = (roleName: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleName)
                ? prev.roles.filter(r => r !== roleName)
                : [...prev.roles, roleName]
        }))
        if (errors.roles) {
            setErrors({ ...errors, roles: null })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setErrors({})
        setSuccess('')

        try {
            await api.post('/users', formData)
            setSuccess('User created successfully!')
            setTimeout(() => {
                navigate('/admin/users')
            }, 1500)
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            }
        } finally {
            setSaving(false)
        }
    }

    const formatRoleName = (role: string) => {
        const names: Record<string, string> = {
            system_admin: 'System Admin',
            institution_admin: 'Institution Admin',
            committee_member: 'Committee Member',
            donor: 'Donor',
        }
        return names[role] || role.charAt(0).toUpperCase() + role.slice(1)
    }

    const canSelectInstitution = currentUser?.roles?.some(role => role.name === 'system_admin')

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-text-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-text-primary">Create User</h1>
                    <p className="text-text-secondary mt-1">Add a new user to the system</p>
                </div>
            </div>

            {success && (
                <div className="p-4 bg-success/10 border border-success/30 text-success rounded-xl text-sm flex items-start gap-3">
                    <span className="text-lg">✓</span>
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-6">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            error={errors.first_name?.[0]}
                            placeholder="Juan"
                            required
                        />
                        <Input
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            error={errors.last_name?.[0]}
                            placeholder="Dela Cruz"
                            required
                        />
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email?.[0]}
                            icon={<Mail className="h-5 w-5" />}
                            placeholder="juan@example.com"
                            required
                        />
                        <Input
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={errors.phone?.[0]}
                            icon={<Phone className="h-5 w-5" />}
                            placeholder="+63 912 345 6789"
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password?.[0]}
                            placeholder="••••••••"
                            required
                        />
                        <Input
                            label="Confirm Password"
                            name="password_confirmation"
                            type="password"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            error={errors.password_confirmation?.[0]}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-6">Location</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Input
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                error={errors.address?.[0]}
                                icon={<MapPin className="h-5 w-5" />}
                                placeholder="Street address"
                            />
                        </div>
                        <Input
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            error={errors.city?.[0]}
                            placeholder="Quezon City"
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
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-6">Institution & Roles</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {canSelectInstitution ? (
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
                                >
                                    <option value="">No Institution</option>
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
                        ) : (
                            <div className="p-4 bg-bg-hover rounded-lg border border-border">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <Building2 className="h-4 w-4" />
                                    <span>Institution: <strong className="text-text-primary">{currentUser?.institution?.name}</strong></span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="label flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                User Roles (select multiple)
                            </label>
                            <div className="space-y-2 mt-2">
                                {roles.map((role) => (
                                    <label
                                        key={role.id}
                                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-bg-hover cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.includes(role.name)}
                                            onChange={() => handleRoleChange(role.name)}
                                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-text-primary">
                                                {formatRoleName(role.name)}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.roles && (
                                <p className="mt-1 text-sm text-danger">{errors.roles[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Account Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-danger">{errors.status[0]}</p>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/admin/users')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={saving}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-5 w-5" />
                        Create User
                    </Button>
                </div>
            </form>
        </div>
    )
}