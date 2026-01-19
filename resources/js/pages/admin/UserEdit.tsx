import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Mail, Phone, MapPin, Building2, Shield } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { useUser } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useInstitutions } from '@/hooks/useInstitutions'

export default function UserEdit() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    const { user, loading, updateUser } = useUser(id!)
    const { roles } = useRoles()
    const { institutions } = useInstitutions({ status: 'active' })

    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Philippines',
        institution_id: '',
        status: 'active',
        roles: [] as string[],
    })

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                country: user.country || 'Philippines',
                institution_id: user.institution_id?.toString() || '',
                status: user.status,
                roles: user.roles?.map(r => r.name) || [],
            })
        }
    }, [user])

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


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setErrors({})
        setSuccess('')

        try {
            await updateUser(formData)
            setSuccess('User updated successfully!')
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

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
            active: 'success',
            pending: 'warning',
            suspended: 'danger',
        }
        return variants[status] || 'info'
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-text-secondary text-xl mb-4">User not found</div>
                <Button onClick={() => navigate('/admin/users')}>
                    Back to Users
                </Button>
            </div>
        )
    }

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
                    <h1 className="text-3xl font-bold text-text-primary">Edit User</h1>
                    <p className="text-text-secondary mt-1">Update user information and settings</p>
                </div>
                <Badge variant={getStatusBadge(user?.status || 'active')}>
                    {user?.status}
                </Badge>
            </div>

            {success && (
                <div className="p-4 bg-success/10 border border-success/30 text-success rounded-xl text-sm flex items-start gap-3">
                    <span className="text-lg">✓</span>
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        {user?.avatar ? (
                            <img
                                src={`/storage/${user.avatar}`}
                                alt={user.name}
                                className="h-20 w-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary">{user?.name}</h3>
                            <p className="text-sm text-text-muted">
                                {formatRoleName(user?.roles?.[0]?.name || 'donor')}
                            </p>
                        </div>
                    </div>

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
                    <h2 className="text-xl font-semibold text-text-primary mb-6">Institution & Role</h2>
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
                        ) : user?.institution && (
                            <div className="p-4 bg-bg-hover rounded-lg border border-border">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <Building2 className="h-4 w-4" />
                                    <span>Institution: <strong className="text-text-primary">{user.institution.name}</strong></span>
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
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}