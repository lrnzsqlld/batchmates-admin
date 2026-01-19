import { useState } from 'react'
import { Search, Plus, Edit, Trash2, Target, Eye, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CampaignModal from '@/components/campaigns/CampaignModal'
import { useCampaigns, useCampaignStats } from '@/hooks/useCampaigns'
import { useDebounce } from '@/hooks/useDebounce'
import { Campaign } from '@/types'
import api from '@/components/helpers/api'
import Pagination from '@/components/ui/Pagination'


export default function Campaigns() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const debouncedSearch = useDebounce(search, 500)

    const { campaigns, loading, pagination, refetch } = useCampaigns({
        search: debouncedSearch,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
    })

    const { stats } = useCampaignStats()

    const handleCreate = () => {
        setSelectedCampaign(null)
        setIsCampaignModalOpen(true)
    }

    const handleEdit = (campaign: Campaign) => {
        setSelectedCampaign(campaign)
        setIsCampaignModalOpen(true)
    }

    const handleView = (id: number) => {
        navigate(`/admin/campaigns/${id}`)
    }

    const handleDeleteClick = (campaign: Campaign) => {
        setSelectedCampaign(campaign)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedCampaign) return

        setDeleteLoading(true)
        try {
            await api.delete(`/campaigns/${selectedCampaign.id}`)
            await refetch()
            setIsDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete campaign:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleCampaignSubmit = async (formData: FormData) => {
        if (selectedCampaign) {
            await api.post(`/campaigns/${selectedCampaign.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        } else {
            await api.post('/campaigns', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        }
        await refetch()
        setIsCampaignModalOpen(false)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Campaigns',
            value: stats.total_campaigns,
            icon: <Target className="h-6 w-6" />,
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
            value: `₱${stats.total_raised.toLocaleString()}`,
            icon: <Target className="h-6 w-6" />,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'Total Goal',
            value: `₱${stats.total_goal.toLocaleString()}`,
            icon: <Target className="h-6 w-6" />,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
    ]

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Campaigns Management</h1>
                        <p className="text-text-secondary mt-1">
                            Manage all campaigns • {campaigns.length} campaigns
                        </p>
                    </div>
                    <Button variant="primary" onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Campaign
                    </Button>
                </div>

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

                <Card className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="text"
                            placeholder="Search campaigns..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<Search className="h-4 w-4" />}
                        />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="input"
                        >
                            <option value="all">All Status</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </Card>

                {campaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                {campaign.image && (
                                    <img
                                        src={`/storage/${campaign.image}`}
                                        alt={campaign.title}
                                        className="w-full h-48 object-cover"
                                    />
                                )}

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant={getStatusBadge(campaign.status)}>
                                            {formatStatus(campaign.status)}
                                        </Badge>
                                        {campaign.priority === 'urgent' && (
                                            <Badge variant="danger">Urgent</Badge>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                                        {campaign.title}
                                    </h3>

                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                                        {campaign.description}
                                    </p>

                                    <div className="space-y-3 mb-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-text-muted">Progress</span>
                                                <span className="font-medium text-text-primary">
                                                    {campaign.progress_percentage?.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${Math.min(campaign.progress_percentage || 0, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-muted">Raised</span>
                                            <span className="font-semibold text-success">
                                                ₱{campaign.raised_amount.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-muted">Goal</span>
                                            <span className="font-medium text-text-primary">
                                                ₱{campaign.goal_amount.toLocaleString()}
                                            </span>
                                        </div>

                                        {campaign.end_date && (
                                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {campaign.days_left !== undefined && campaign.days_left >= 0
                                                        ? `${campaign.days_left} days left`
                                                        : 'Ended'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleView(campaign.id)}
                                            className="p-2 text-text-secondary hover:text-info hover:bg-bg-hover rounded-lg transition-colors"
                                            title="View details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(campaign)}
                                            className="p-2 text-text-secondary hover:text-primary hover:bg-bg-hover rounded-lg transition-colors"
                                            title="Edit campaign"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(campaign)}
                                            className="p-2 text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors"
                                            title="Delete campaign"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-4">
                            <Target className="h-8 w-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No campaigns found</h3>
                        <p className="text-text-secondary mb-6">
                            Get started by creating your first campaign
                        </p>
                        <Button variant="primary" onClick={handleCreate}>
                            Create Campaign
                        </Button>
                    </Card>
                )}
            </div>

            {campaigns.length > 0 && pagination.last_page > 1 && (
                <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    onPageChange={(page) => refetch(page)}
                />
            )}

            <CampaignModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                onSubmit={handleCampaignSubmit}
                campaign={selectedCampaign}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Campaign"
                message={`Are you sure you want to delete "${selectedCampaign?.title}"? This will permanently delete all associated donations.`}
                confirmText="Delete Campaign"
                variant="danger"
                loading={deleteLoading}
            />
        </>
    )
}