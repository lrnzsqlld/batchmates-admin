import { useState } from 'react'
import { Search, Plus, Edit, Trash2, Building2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useInstitutions } from '@/hooks/useInstitutions'
import { useDebounce } from '@/hooks/useDebounce'
import { Institution } from '@/types'
import api from '@/components/helpers/api'
import InstitutionModal from '@/components/institutions/InstitutionModal'
import Pagination from '@/components/ui/Pagination'

export default function Institutions() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false)
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const debouncedSearch = useDebounce(search, 500)

    const { institutions, loading, pagination, refetch } = useInstitutions({
        search: debouncedSearch,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
    })

    const handleCreate = () => {
        setSelectedInstitution(null)
        setIsInstitutionModalOpen(true)
    }

    const handleEdit = (institution: Institution) => {
        setSelectedInstitution(institution)
        setIsInstitutionModalOpen(true)
    }

    const handleView = (id: number) => {
        navigate(`/admin/institutions/${id}`)
    }

    const handleDeleteClick = (institution: Institution) => {
        setSelectedInstitution(institution)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedInstitution) return

        setDeleteLoading(true)
        try {
            await api.delete(`/institutions/${selectedInstitution.id}`)
            await refetch()
            setIsDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete institution:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleInstitutionSubmit = async (formData: FormData) => {
        if (selectedInstitution) {
            await api.post(`/institutions/${selectedInstitution.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        } else {
            await api.post('/institutions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        }
        await refetch()
        setIsInstitutionModalOpen(false)
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
            active: 'success',
            pending: 'warning',
            suspended: 'danger',
        }
        return variants[status] || 'info'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Institutions</h1>
                        <p className="text-text-secondary mt-1">
                            Manage all institutions • {institutions.length} institutions
                        </p>
                    </div>
                    <Button variant="primary" onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Institution
                    </Button>
                </div>

                <Card className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="text"
                            placeholder="Search institutions..."
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
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </Card>

                {institutions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {institutions.map((institution) => (
                            <Card key={institution.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {institution.logo ? (
                                            <img
                                                src={`/storage/${institution.logo}`}
                                                alt={institution.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-primary" />
                                            </div>
                                        )}
                                        <Badge variant={getStatusBadge(institution.status)}>
                                            {institution.status}
                                        </Badge>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-1">
                                    {institution.name}
                                </h3>

                                <div className="space-y-2 text-sm text-text-secondary mb-4">
                                    <p className="flex items-center gap-2">
                                        <span className="text-text-muted">📧</span>
                                        {institution.email}
                                    </p>
                                    {institution.city && (
                                        <p className="flex items-center gap-2">
                                            <span className="text-text-muted">📍</span>
                                            {institution.city}, {institution.country}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                                    <button
                                        onClick={() => handleView(institution.id)}
                                        className="p-2 text-text-secondary hover:text-info hover:bg-bg-hover rounded-lg transition-colors"
                                        title="View details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(institution)}
                                        className="p-2 text-text-secondary hover:text-primary hover:bg-bg-hover rounded-lg transition-colors"
                                        title="Edit institution"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(institution)}
                                        className="p-2 text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors"
                                        title="Delete institution"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-4">
                            <Building2 className="h-8 w-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No institutions found</h3>
                        <p className="text-text-secondary mb-6">
                            Get started by adding your first institution
                        </p>
                        <Button variant="primary" onClick={handleCreate}>
                            Add Institution
                        </Button>
                    </Card>
                )}
            </div>
            {institutions.length > 0 && pagination.last_page > 1 && (
                <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    onPageChange={(page) => refetch(page)}
                />
            )}

            <InstitutionModal
                isOpen={isInstitutionModalOpen}
                onClose={() => setIsInstitutionModalOpen(false)}
                onSubmit={handleInstitutionSubmit}
                institution={selectedInstitution}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Institution"
                message={`Are you sure you want to delete "${selectedInstitution?.name}"? This will permanently delete all associated data including users, campaigns, and donations.`}
                confirmText="Delete Institution"
                variant="danger"
                loading={deleteLoading}
            />
        </>
    )
}