import { JSX, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Target,
    Calendar,
    DollarSign,
    TrendingUp,
    Heart,
    Users,
    Building2,
    Edit,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    User,
    Mail,
    Phone,
    MapPin,
    FileText
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import CampaignModal from '@/components/campaigns/CampaignModal'
import { useCampaign } from '@/hooks/useCampaigns'
import { useCampaignDonations } from '@/hooks/useDonations'
import api from '@/components/helpers/api'

type TabType = 'overview' | 'donations' | 'withdrawals'

export default function CampaignDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)

    const { campaign, loading, refetch: refetchCampaign } = useCampaign(id!)

    const {
        donations,
        loading: donationsLoading,
        pagination: donationsPagination,
        refetch: refetchDonations
    } = useCampaignDonations({
        campaign_id: parseInt(id!),
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-text-secondary text-xl mb-4">Campaign not found</div>
                <Button onClick={() => navigate('/admin/campaigns')}>
                    Back to Campaigns
                </Button>
            </div>
        )
    }

    const handleCampaignSubmit = async (formData: FormData) => {
        await api.post(`/campaigns/${campaign.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        await refetchCampaign()
        setIsCampaignModalOpen(false)
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Target className="h-4 w-4" /> },
        { id: 'donations', label: 'Donations', icon: <Heart className="h-4 w-4" /> },
        { id: 'withdrawals', label: 'Withdrawals', icon: <DollarSign className="h-4 w-4" /> },
    ]

    const getStatusIcon = (status: string) => {
        const icons: Record<string, JSX.Element> = {
            active: <CheckCircle className="h-5 w-5 text-success" />,
            approved: <CheckCircle className="h-5 w-5 text-success" />,
            completed: <CheckCircle className="h-5 w-5 text-success" />,
            pending_review: <Clock className="h-5 w-5 text-warning" />,
            rejected: <XCircle className="h-5 w-5 text-danger" />,
            closed: <XCircle className="h-5 w-5 text-danger" />,
        }
        return icons[status] || <AlertCircle className="h-5 w-5 text-text-muted" />
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
            active: 'success',
            approved: 'success',
            completed: 'success',
            pending_review: 'warning',
            rejected: 'danger',
            closed: 'danger',
        }
        return variants[status] || 'info'
    }

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    const progressPercentage = campaign.progress_percentage || 0
    const daysLeft = campaign.days_left ?? 0

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/campaigns')}
                            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-text-secondary" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">{campaign.title}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                {getStatusIcon(campaign.status)}
                                <Badge variant={getStatusBadge(campaign.status)}>
                                    {formatStatus(campaign.status)}
                                </Badge>
                                {campaign.priority === 'urgent' && (
                                    <Badge variant="danger">Urgent Priority</Badge>
                                )}
                                {campaign.campaign_type && (
                                    <Badge variant={campaign.campaign_type === 'general' ? 'primary' : 'warning'}>
                                        {campaign.campaign_type}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsCampaignModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit Campaign
                    </Button>
                </div>

                {/* Campaign Image */}
                {campaign.image && (
                    <Card className="overflow-hidden">
                        <img
                            src={`/storage/${campaign.image}`}
                            alt={campaign.title}
                            className="w-full h-96 object-cover"
                        />
                    </Card>
                )}

                {/* Progress Section */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted">Campaign Progress</p>
                                    <p className="text-2xl font-bold text-text-primary">
                                        {progressPercentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            {campaign.end_date && (
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Time Remaining</p>
                                    <p className="text-xl font-semibold text-text-primary">
                                        {daysLeft > 0 ? `${daysLeft} days` : 'Ended'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <div className="h-4 bg-bg-hover rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                            <div className="text-center p-4 bg-bg-hover rounded-xl">
                                <p className="text-sm text-text-muted mb-1">Raised Amount</p>
                                <p className="text-2xl font-bold text-success">
                                    ₱{Number(campaign.raised_amount).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-bg-hover rounded-xl">
                                <p className="text-sm text-text-muted mb-1">Goal Amount</p>
                                <p className="text-2xl font-bold text-primary">
                                    ₱{Number(campaign.goal_amount).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-bg-hover rounded-xl">
                                <p className="text-sm text-text-muted mb-1">Available Balance</p>
                                <p className="text-2xl font-bold text-warning">
                                    ₱{Number(campaign.available_balance || campaign.raised_amount).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold text-text-primary mb-4">Description</h2>
                                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                                    {campaign.description || 'No description provided'}
                                </p>
                            </Card>

                            {campaign.rejection_reason && (
                                <Card className="p-6 border-l-4 border-danger bg-danger/5">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-danger mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-danger mb-2">Rejection Reason</h3>
                                            <p className="text-text-secondary">{campaign.rejection_reason}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Institution Info */}
                            {campaign.institution && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Institution
                                    </h2>
                                    <div
                                        className="flex items-center gap-4 p-4 bg-bg-hover rounded-xl cursor-pointer hover:bg-bg-hover/70 transition-colors"
                                        onClick={() => navigate(`/admin/institutions/${campaign.institution.id}`)}
                                    >
                                        {campaign.institution.logo ? (
                                            <img
                                                src={`/storage/${campaign.institution.logo}`}
                                                alt={campaign.institution.name}
                                                className="h-12 w-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-primary" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-text-primary">{campaign.institution.name}</p>
                                            <p className="text-sm text-text-muted">
                                                {campaign.institution.city}, {campaign.institution.country}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Beneficiary Info */}
                            {campaign.beneficiary && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Beneficiary
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            {campaign.beneficiary.avatar ? (
                                                <img
                                                    src={`/storage/${campaign.beneficiary.avatar}`}
                                                    alt={campaign.beneficiary.name}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                                    {campaign.beneficiary.first_name?.charAt(0)}
                                                    {campaign.beneficiary.last_name?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-text-primary">{campaign.beneficiary.name}</p>
                                                <p className="text-sm text-text-muted">{campaign.beneficiary.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold text-text-primary mb-4">Details</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-text-muted" />
                                        <div>
                                            <p className="text-sm text-text-muted">Created</p>
                                            <p className="text-text-primary">
                                                {new Date(campaign.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {campaign.end_date && (
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-text-muted" />
                                            <div>
                                                <p className="text-sm text-text-muted">End Date</p>
                                                <p className="text-text-primary">
                                                    {new Date(campaign.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {campaign.approved_at && (
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-text-muted" />
                                            <div>
                                                <p className="text-sm text-text-muted">Approved</p>
                                                <p className="text-text-primary">
                                                    {new Date(campaign.approved_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {campaign.creator && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-text-primary mb-4">Created By</h2>
                                    <div className="flex items-center gap-3">
                                        {campaign.creator.avatar ? (
                                            <img
                                                src={`/storage/${campaign.creator.avatar}`}
                                                alt={campaign.creator.name}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                                {campaign.creator.first_name?.charAt(0)}
                                                {campaign.creator.last_name?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-text-primary">{campaign.creator.name}</p>
                                            <p className="text-sm text-text-muted">{campaign.creator.email}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
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
                                    <p className="text-text-muted">No donations yet</p>
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

                {activeTab === 'withdrawals' && (
                    <Card className="p-6">
                        <div className="text-center py-16">
                            <DollarSign className="h-12 w-12 text-text-muted mx-auto mb-4" />
                            <p className="text-text-muted mb-4">Withdrawal management coming soon</p>
                            <p className="text-sm text-text-muted">
                                This section will display all withdrawal requests for this campaign
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            <CampaignModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                onSubmit={handleCampaignSubmit}
                campaign={campaign}
            />
        </>
    )
}