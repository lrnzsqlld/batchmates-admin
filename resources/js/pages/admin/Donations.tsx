import { useState } from 'react'
import { Search, Download, Heart, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useDonations } from '@/hooks/useDonations'

export default function Donations() {
    const [search, setSearch] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedDonationId, setSelectedDonationId] = useState<number | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const debouncedSearch = useDebounce(search, 500)

    const {
        donations,
        stats,
        loading,
        pagination,
        refetch,
        deleteDonation,
        updateDonationStatus
    } = useDonations({
        search: debouncedSearch,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
    })

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await updateDonationStatus(id, status)
        } catch (error) {
            console.error('Failed to update donation:', error)
        }
    }

    const handleDeleteClick = (id: number) => {
        setSelectedDonationId(id)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedDonationId) return

        setDeleteLoading(true)
        try {
            await deleteDonation(selectedDonationId)
            setIsDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete donation:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
            completed: 'success',
            pending: 'warning',
            failed: 'danger',
        }
        return variants[status] || 'info'
    }

    const getStatusIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle className="h-4 w-4" />
        if (status === 'pending') return <Clock className="h-4 w-4" />
        return <XCircle className="h-4 w-4" />
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
            title: 'Total Donations',
            value: `₱${stats.total_donations.toLocaleString()}`,
            icon: <Heart className="h-6 w-6" />,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'This Month',
            value: `₱${stats.this_month.toLocaleString()}`,
            icon: <Heart className="h-6 w-6" />,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Completed',
            value: stats.total_count,
            icon: <CheckCircle className="h-6 w-6" />,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'Pending',
            value: stats.pending_count,
            icon: <Clock className="h-6 w-6" />,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
    ]

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Donations Management</h1>
                        <p className="text-text-secondary mt-1">
                            Track and manage all donations • {pagination.total} total donations
                        </p>
                    </div>
                    <Button variant="primary" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
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
                            placeholder="Search by donor, email, transaction ID, or campaign..."
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
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </Card>

                {donations.length > 0 ? (
                    <>
                        <Card className="overflow-hidden p-0">
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Transaction</th>
                                            <th>Donor</th>
                                            <th>Campaign</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donations.map((donation) => (
                                            <tr key={donation.id}>
                                                <td>
                                                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                                        {donation.transaction_id}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Heart className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-text-primary">
                                                                {donation.donor_display_name || donation.donor_name || 'Anonymous'}
                                                            </p>
                                                            {!donation.is_anonymous && donation.donor_email && (
                                                                <p className="text-xs text-text-muted">{donation.donor_email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p className="text-sm text-text-primary truncate max-w-xs">
                                                        {donation.campaign?.title || 'N/A'}
                                                    </p>
                                                </td>
                                                <td>
                                                    <span className="font-semibold text-success text-lg">
                                                        ₱{Number(donation.amount).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-sm text-text-secondary capitalize">
                                                        {donation.payment_method || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Badge variant={getStatusBadge(donation.status)}>
                                                        <div className="flex items-center gap-1.5">
                                                            {getStatusIcon(donation.status)}
                                                            {donation.status}
                                                        </div>
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="text-sm">
                                                        <p className="text-text-primary">
                                                            {new Date(donation.created_at).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs text-text-muted">
                                                            {new Date(donation.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {donation.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(donation.id, 'completed')}
                                                                    className="p-2 text-text-secondary hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                                                                    title="Approve donation"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(donation.id, 'failed')}
                                                                    className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                                                    title="Reject donation"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteClick(donation.id)}
                                                            className="p-2 text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors"
                                                            title="Delete donation"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {pagination.last_page > 1 && (
                            <Pagination
                                currentPage={pagination.current_page}
                                lastPage={pagination.last_page}
                                onPageChange={(page) => refetch(page)}
                            />
                        )}
                    </>
                ) : (
                    <Card className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-4">
                            <Heart className="h-8 w-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No donations found</h3>
                        <p className="text-text-secondary mb-6">
                            Try adjusting your search or filter criteria
                        </p>
                        <Button variant="secondary" onClick={() => {
                            setSearch('')
                            setSelectedStatus('all')
                        }}>
                            Clear Filters
                        </Button>
                    </Card>
                )}
            </div>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Donation"
                message="Are you sure you want to delete this donation? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                loading={deleteLoading}
            />
        </>
    )
}