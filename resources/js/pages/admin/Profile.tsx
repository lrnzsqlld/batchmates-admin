import { useState, useEffect } from 'react'
import { Camera, Mail, Phone, MapPin, Calendar, Briefcase, Lock, Save, Building2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useInstitutions } from '@/hooks/useInstitutions'
import api from '@/components/helpers/api'

export default function Profile() {
    const { user: authUser, setUser } = useAuth()
    const { institutions } = useInstitutions({ status: 'active' })
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [success, setSuccess] = useState('')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: '',
        address: '',
        city: '',
        country: 'Philippines',
        date_of_birth: '',
        gender: '',
        institution_id: '',
        avatar: null as File | null,
    })

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    })

    useEffect(() => {
        if (authUser) {
            setProfileData({
                first_name: authUser.first_name || '',
                last_name: authUser.last_name || '',
                email: authUser.email || '',
                phone: authUser.phone || '',
                bio: authUser.bio || '',
                address: authUser.address || '',
                city: authUser.city || '',
                country: authUser.country || 'Philippines',
                date_of_birth: authUser.date_of_birth || '',
                gender: authUser.gender || '',
                institution_id: authUser.institution_id?.toString() || '',
                avatar: null,
            })

            if (authUser.avatar) {
                setAvatarPreview(`/storage/${authUser.avatar}`)
            }
        }
    }, [authUser])

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value,
        })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null })
        }
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null })
        }
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProfileData({ ...profileData, avatar: file })
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})
        setSuccess('')

        try {
            const formData = new FormData()
            Object.entries(profileData).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                    if (key === 'avatar' && value instanceof File) {
                        formData.append(key, value)
                    } else if (key !== 'avatar') {
                        formData.append(key, value as string)
                    }
                }
            })

            formData.append('_method', 'PUT')

            const response = await api.post('/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            setUser(response.data.data)
            setSuccess('Profile updated successfully!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            }
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})
        setSuccess('')

        try {
            await api.put('/profile/password', passwordData)
            setSuccess('Password updated successfully!')
            setPasswordData({
                current_password: '',
                password: '',
                password_confirmation: '',
            })
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            }
        } finally {
            setLoading(false)
        }
    }

    const canChangeInstitution = authUser?.roles?.some(role => role.name === 'system_admin')

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Profile Settings</h1>
                <p className="text-text-secondary">Manage your account information and preferences</p>
            </div>

            {success && (
                <div className="p-4 bg-success/10 border border-success/30 text-success rounded-xl text-sm flex items-start gap-3">
                    <span className="text-lg">✓</span>
                    <span>{success}</span>
                </div>
            )}

            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'profile'
                        ? 'text-primary'
                        : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    Profile Information
                    {activeTab === 'profile' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'password'
                        ? 'text-primary'
                        : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    Password & Security
                    {activeTab === 'password' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                </button>
            </div>

            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Profile Photo</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-bg-hover flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-text-muted">
                                            {authUser?.first_name?.charAt(0)}{authUser?.last_name?.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-colors">
                                    <Camera className="h-4 w-4 text-white" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            </div>
                            <div>
                                <h3 className="font-medium text-text-primary mb-1">{authUser?.name}</h3>
                                <p className="text-sm text-text-muted mb-2">{authUser?.email}</p>
                                <p className="text-xs text-text-muted">JPG, PNG or GIF. Max size 2MB.</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="First Name"
                                name="first_name"
                                value={profileData.first_name}
                                onChange={handleProfileChange}
                                error={errors.first_name?.[0]}
                                placeholder="Juan"
                                required
                            />
                            <Input
                                label="Last Name"
                                name="last_name"
                                value={profileData.last_name}
                                onChange={handleProfileChange}
                                error={errors.last_name?.[0]}
                                placeholder="Dela Cruz"
                                required
                            />
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                error={errors.email?.[0]}
                                icon={<Mail className="h-5 w-5" />}
                                required
                            />
                            <Input
                                label="Phone Number"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                error={errors.phone?.[0]}
                                icon={<Phone className="h-5 w-5" />}
                                placeholder="+63 912 345 6789"
                            />
                            <Input
                                label="Date of Birth"
                                name="date_of_birth"
                                type="date"
                                value={profileData.date_of_birth}
                                onChange={handleProfileChange}
                                error={errors.date_of_birth?.[0]}
                                icon={<Calendar className="h-5 w-5" />}
                            />
                            <div>
                                <label className="label">Gender</label>
                                <select
                                    name="gender"
                                    value={profileData.gender}
                                    onChange={handleProfileChange}
                                    className="input"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">Bio</label>
                                <textarea
                                    name="bio"
                                    value={profileData.bio}
                                    onChange={handleProfileChange}
                                    className="input min-h-24"
                                    placeholder="Tell us about yourself..."
                                />
                                {errors.bio && (
                                    <p className="mt-1 text-sm text-danger">{errors.bio[0]}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Location</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    label="Address"
                                    name="address"
                                    value={profileData.address}
                                    onChange={handleProfileChange}
                                    error={errors.address?.[0]}
                                    icon={<MapPin className="h-5 w-5" />}
                                    placeholder="Street address"
                                />
                            </div>
                            <Input
                                label="City"
                                name="city"
                                value={profileData.city}
                                onChange={handleProfileChange}
                                error={errors.city?.[0]}
                                placeholder="Quezon City"
                            />
                            <Input
                                label="Country"
                                name="country"
                                value={profileData.country}
                                onChange={handleProfileChange}
                                error={errors.country?.[0]}
                                placeholder="Philippines"
                            />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Institution</h2>
                        {canChangeInstitution ? (
                            <div>
                                <label className="label flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Institution
                                </label>
                                <select
                                    name="institution_id"
                                    value={profileData.institution_id}
                                    onChange={handleProfileChange}
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
                        ) : (
                            <div className="p-4 bg-bg-hover rounded-lg border border-border">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <Building2 className="h-4 w-4" />
                                    <span>Institution: <strong className="text-text-primary">{authUser?.institution?.name || 'No Institution'}</strong></span>
                                </div>
                                <p className="text-xs text-text-muted mt-2">Contact an administrator to change your institution</p>
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" loading={loading} className="flex items-center gap-2">
                            <Save className="h-5 w-5" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            )}

            {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Change Password</h2>

                        {errors.general && (
                            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm">
                                {errors.general}
                            </div>
                        )}

                        <div className="space-y-6 max-w-md">
                            <div>
                                <label className="label">Current Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className="input pl-12"
                                        required
                                    />
                                </div>
                                {errors.current_password && (
                                    <p className="mt-1 text-sm text-danger">{errors.current_password[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="label">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={passwordData.password}
                                        onChange={handlePasswordChange}
                                        className="input pl-12"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-danger">{errors.password[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="label">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        value={passwordData.password_confirmation}
                                        onChange={handlePasswordChange}
                                        className="input pl-12"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" loading={loading} className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Update Password
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}