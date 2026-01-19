import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    Users,
    Target,
    TrendingUp,
    Heart,
    CreditCard,
    UserCheck,
    Edit,
    DollarSign,
    Plus,
    Trash2,
    Star,
    Calendar,
    CheckCircle,
    Edit2
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import BankAccountModal from '@/components/institutions/BankAccountModal'
import InstitutionModal from '@/components/institutions/InstitutionModal'
import {
    useInstitutionDetails,
    useInstitutionCampaigns,
    useInstitutionDonations,
    useInstitutionUsers
} from '@/hooks/useInstitutions'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { BankAccount } from '@/types'
import api from '@/components/helpers/api'

type TabType = 'overview' | 'campaigns' | 'committee' | 'donations' | 'banking'

export default function InstitutionDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [isBankModalOpen, setIsBankModalOpen] = useState(false)
    const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false)
    const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const { institution, stats, loading, refetch: refetchInstitution } = useInstitutionDetails(id!)

    const {
        campaigns,
        loading: campaignsLoading,
        pagination: campaignsPagination,
        refetch: refetchCampaigns
    } = useInstitutionCampaigns({
        institution_id: parseInt(id!),
    })

    const {
        donations,
        loading: donationsLoading,
        pagination: donationsPagination,
        refetch: refetchDonations
    } = useInstitutionDonations({
        institution_id: parseInt(id!),
    })

    const {
        users: committeeMembers,
        loading: usersLoading,
        pagination: usersPagination,
        refetch: refetchUsers
    } = useInstitutionUsers({
        institution_id: parseInt(id!),
        role: 'committee_member',
    })

    const {
        bankAccounts,
        loading: bankAccountsLoading,
        refetch: refetchBankAccounts,
        createBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setPrimaryAccount,
    } = useBankAccounts({
        institution_id: parseInt(id!),
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!institution) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-text-secondary text-xl mb-4">Institution not found</div>
                <Button onClick={() => navigate('/admin/institutions')}>
                    Back to Institutions
                </Button>
            </div>
        )
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
        { id: 'campaigns', label: 'Campaigns', icon: <Target className="h-4 w-4" /> },
        { id: 'committee', label: 'Committee Members', icon: <UserCheck className="h-4 w-4" /> },
        { id: 'donations', label: 'Donations', icon: <Heart className="h-4 w-4" /> },
        { id: 'banking', label: 'Banking Details', icon: <CreditCard className="h-4 w-4" /> },
    ]

    const statCards = [
        {
            title: 'Total Users',
            value: stats.total_users,
            icon: <Users className="h-6 w-6" />,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Active Campaigns',
            value: stats.active_campaigns,
            icon: <Target className="h-6 w-6" />,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'Total Raised',
            value: `₱${stats.total_raised?.toLocaleString()}`,
            icon: <TrendingUp className="h-6 w-6" />,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            title: 'Total Donations',
            value: `₱${stats.total_donations?.toLocaleString()}`,
            icon: <Heart className="h-6 w-6" />,
            color: 'text-danger',
            bgColor: 'bg-danger/10',
        },
    ]

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
            active: 'success',
            pending: 'warning',
            suspended: 'danger',
            completed: 'success',
            rejected: 'danger',
            inactive: 'danger',
        }
        return variants[status] || 'info'
    }

    const handleAddBankAccount = () => {
        setSelectedBankAccount(null)
        setIsBankModalOpen(true)
    }

    const handleEditBankAccount = (account: BankAccount) => {
        setSelectedBankAccount(account)
        setIsBankModalOpen(true)
    }

    const handleDeleteBankAccount = (account: BankAccount) => {
        setSelectedBankAccount(account)
        setIsDeleteDialogOpen(true)
    }

    const handleBankAccountSubmit = async (data: Partial<BankAccount>) => {
        if (selectedBankAccount?.id) {
            await updateBankAccount(selectedBankAccount.id, data)
        } else {
            await createBankAccount(data)
        }
        await refetchBankAccounts()
        setIsBankModalOpen(false)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedBankAccount?.id) return

        setDeleteLoading(true)
        try {
            await deleteBankAccount(selectedBankAccount.id)
            await refetchBankAccounts()
            setIsDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete bank account:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleSetPrimary = async (accountId?: number) => {
        if (!accountId) return
        try {
            await setPrimaryAccount(accountId)
            await refetchBankAccounts()
        } catch (error) {
            console.error('Failed to set primary account:', error)
        }
    }

    const handleEditInstitution = () => {
        setIsInstitutionModalOpen(true)
    }

    const handleInstitutionSubmit = async (formData: FormData) => {
        if (institution) {
            await api.post(`/institutions/${institution.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        }
        await refetchInstitution()
        setIsInstitutionModalOpen(false)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/institutions')}
                        className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-text-secondary" />
                    </button>
                    <div className="flex items-center gap-4">
                        {institution.logo ? (
                            <img
                                src={`/storage/${institution.logo}`}
                                alt={institution.name}
                                className="h-16 w-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">{institution.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge variant={getStatusBadge(institution.status)}>
                                    {institution.status}
                                </Badge>
                                <span className="text-sm text-text-muted">
                                    {institution.city}, {institution.country}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button
                    variant="primary"
                    onClick={handleEditInstitution}
                    className="flex items-center gap-2"
                >
                    <Edit className="h-4 w-4" />
                    Edit Institution
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                <div className={stat.color}>{stat.icon}</div>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-text-muted mb-1">{stat.title}</p>
                            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-6 py-3 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'text-primary'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Contact Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-text-muted" />
                                <div>
                                    <p className="text-sm text-text-muted">Email</p>
                                    <p className="text-text-primary">{institution.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-text-muted" />
                                <div>
                                    <p className="text-sm text-text-muted">Phone</p>
                                    <p className="text-text-primary">{institution.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-text-muted" />
                                <div>
                                    <p className="text-sm text-text-muted">Address</p>
                                    <p className="text-text-primary">
                                        {institution.address || 'N/A'}<br />
                                        {institution.city}, {institution.country}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Stats</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-secondary">Total Campaigns</span>
                                <span className="text-xl font-semibold text-text-primary">{stats.total_campaigns}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-secondary">Active Campaigns</span>
                                <span className="text-xl font-semibold text-success">{stats.active_campaigns}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-secondary">Total Users</span>
                                <span className="text-xl font-semibold text-text-primary">{stats.total_users}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-text-secondary">Committee Members</span>
                                <span className="text-xl font-semibold text-text-primary">{committeeMembers.length}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'campaigns' && (
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        {campaignsLoading ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : campaigns.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Campaign</th>
                                            <th>Type</th>
                                            <th>Goal</th>
                                            <th>Raised</th>
                                            <th>Progress</th>
                                            <th>Status</th>
                                            <th>End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((campaign) => (
                                            <tr
                                                key={campaign.id}
                                                className="cursor-pointer hover:bg-bg-hover"
                                                onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                                            >
                                                <td>
                                                    <div className="font-medium text-text-primary">{campaign.title}</div>
                                                </td>
                                                <td>
                                                    <Badge variant={campaign.campaign_type === 'general' ? 'success' : 'warning'}>
                                                        {campaign.campaign_type}
                                                    </Badge>
                                                </td>
                                                <td>₱{Number(campaign.goal_amount)?.toLocaleString()}</td>
                                                <td>₱{Number(campaign.raised_amount)?.toLocaleString()}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-success transition-all"
                                                                style={{ width: `${Math.min(campaign.progress_percentage || 0, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-text-secondary">
                                                            {campaign.progress_percentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge variant={getStatusBadge(campaign.status)}>
                                                        {campaign.status}
                                                    </Badge>
                                                </td>
                                                <td className="text-sm text-text-secondary">
                                                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Target className="h-12 w-12 text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted">No campaigns found</p>
                            </div>
                        )}
                    </Card>

                    {campaigns.length > 0 && campaignsPagination.last_page > 1 && (
                        <Pagination
                            currentPage={campaignsPagination.current_page}
                            lastPage={campaignsPagination.last_page}
                            onPageChange={(page) => refetchCampaigns(page)}
                        />
                    )}
                </div>
            )}

            {activeTab === 'committee' && (
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        {usersLoading ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : committeeMembers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {committeeMembers.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="cursor-pointer hover:bg-bg-hover"
                                                onClick={() => navigate(`/admin/users/${member.id}/edit`)}
                                            >
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        {member.avatar ? (
                                                            <img
                                                                src={`/storage/${member.avatar}`}
                                                                alt={member.name}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                                                {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-text-primary">{member.name}</div>
                                                            <div className="text-sm text-text-muted">Committee Member</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-text-secondary">{member.email}</td>
                                                <td className="text-text-secondary">{member.phone || 'N/A'}</td>
                                                <td>
                                                    <Badge variant={getStatusBadge(member.status)}>
                                                        {member.status}
                                                    </Badge>
                                                </td>
                                                <td className="text-sm text-text-secondary">
                                                    {new Date(member.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <UserCheck className="h-12 w-12 text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted">No committee members found</p>
                            </div>
                        )}
                    </Card>

                    {committeeMembers.length > 0 && usersPagination.last_page > 1 && (
                        <Pagination
                            currentPage={usersPagination.current_page}
                            lastPage={usersPagination.last_page}
                            onPageChange={(page) => refetchUsers(page)}
                        />
                    )}
                </div>
            )}

            {activeTab === 'donations' && (
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        {donationsLoading ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : donations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Donor</th>
                                            <th>Campaign</th>
                                            <th>Amount</th>
                                            <th>Payment Method</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donations.map((donation) => (
                                            <tr key={donation.id}>
                                                <td>
                                                    <div className="font-medium text-text-primary">
                                                        {donation.donor_display_name || donation.donor_name || 'Anonymous'}
                                                    </div>
                                                    {!donation.is_anonymous && donation.donor_email && (
                                                        <div className="text-sm text-text-muted">{donation.donor_email}</div>
                                                    )}
                                                </td>
                                                <td className="text-sm text-text-secondary">
                                                    {donation.campaign?.title || 'N/A'}
                                                </td>
                                                <td className="font-semibold text-success">
                                                    ₱{Number(donation.amount)?.toLocaleString()}
                                                </td>
                                                <td className="text-sm text-text-secondary capitalize">
                                                    {donation.payment_method}
                                                </td>
                                                <td>
                                                    <Badge variant={getStatusBadge(donation.status)}>
                                                        {donation.status}
                                                    </Badge>
                                                </td>
                                                <td className="text-sm text-text-secondary">
                                                    {new Date(donation.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Heart className="h-12 w-12 text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted">No donations found</p>
                            </div>
                        )}
                    </Card>

                    {donations.length > 0 && donationsPagination.last_page > 1 && (
                        <Pagination
                            currentPage={donationsPagination.current_page}
                            lastPage={donationsPagination.last_page}
                            onPageChange={(page) => refetchDonations(page)}
                        />
                    )}
                </div>
            )}

            {activeTab === 'banking' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text-primary">Bank Accounts</h2>
                                    <p className="text-sm text-text-muted">Manage withdrawal and payment accounts</p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleAddBankAccount}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Bank Account
                            </Button>
                        </div>

                        {bankAccountsLoading ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : bankAccounts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bankAccounts.map((account) => (
                                    <Card key={account.id} className="p-4 border border-border">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusBadge(account.status)}>
                                                    {account.status}
                                                </Badge>
                                                {account.is_primary && (
                                                    <Badge variant="warning">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditBankAccount(account)}
                                                    className="p-1.5 hover:bg-bg-hover rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4 text-text-secondary" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBankAccount(account)}
                                                    className="p-1.5 hover:bg-bg-hover rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-danger" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-text-primary mb-1">{account.bank_name}</h3>
                                        <p className="text-sm text-text-secondary mb-3">{account.account_holder}</p>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-text-muted">Account Number</span>
                                                <span className="font-mono text-text-primary">
                                                    {account.masked_account_number || '****'}
                                                </span>
                                            </div>
                                            {account.branch && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-text-muted">Branch</span>
                                                    <span className="text-text-primary">{account.branch}</span>
                                                </div>
                                            )}
                                            {account.swift_code && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-text-muted">SWIFT Code</span>
                                                    <span className="font-mono text-text-primary">{account.swift_code}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                                <span className="text-text-muted">Effective From</span>
                                                <span className="text-text-primary">
                                                    {new Date(account.effective_from).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {account.effective_until && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-text-muted">Effective Until</span>
                                                    <span className="text-text-primary">
                                                        {new Date(account.effective_until).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {!account.is_primary && account.status === 'active' && (
                                            <Button
                                                variant="secondary"
                                                className="w-full mt-4"
                                                onClick={() => account.id && handleSetPrimary(account.id)}
                                            >
                                                <Star className="h-4 w-4 mr-2" />
                                                Set as Primary
                                            </Button>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 bg-bg-hover rounded-xl text-center">
                                <DollarSign className="h-12 w-12 text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted mb-4">No bank accounts added yet</p>
                                <p className="text-sm text-text-muted mb-6">
                                    Add a bank account to enable withdrawal processing
                                </p>
                                <Button variant="primary" onClick={handleAddBankAccount}>

                                    Add Your First Bank Account
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            <InstitutionModal
                isOpen={isInstitutionModalOpen}
                onClose={() => setIsInstitutionModalOpen(false)}
                onSubmit={handleInstitutionSubmit}
                institution={institution}
            />

            <BankAccountModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                onSubmit={handleBankAccountSubmit}
                bankAccount={selectedBankAccount}
                institutionId={parseInt(id!)}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Bank Account"
                message={`Are you sure you want to delete this bank account? This action cannot be undone.`}
                confirmText="Delete Account"
                variant="danger"
                loading={deleteLoading}
            />
        </div>
    )
}