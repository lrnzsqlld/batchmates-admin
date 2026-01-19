import { useState } from 'react'
import { Search, Plus, Edit, Trash2, UserCog, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useUsers } from '@/hooks/useUsers'
import { useDebounce } from '@/hooks/useDebounce'
import { User } from '@/types'
import api from '@/components/helpers/api'
import Pagination from '@/components/ui/Pagination'

export default function Users() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const debouncedSearch = useDebounce(search, 500)

    const { users, loading, pagination, refetch } = useUsers({
        search: debouncedSearch,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
    })

    const handleEdit = (userId: number, e?: React.MouseEvent) => {
        // Stop event propagation if called from within a row
        if (e) {
            e.stopPropagation()
        }
        navigate(`/admin/users/${userId}/edit`)
    }

    const handleDeleteClick = (user: User, e?: React.MouseEvent) => {
        // Stop event propagation
        if (e) {
            e.stopPropagation()
        }
        setSelectedUser(user)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return

        setDeleteLoading(true)
        try {
            await api.delete(`/users/${selectedUser.id}`)
            await refetch()
            setIsDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete user:', error)
        } finally {
            setDeleteLoading(false)
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

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            system_admin: 'bg-red-500/10 text-red-500',
            institution_admin: 'bg-purple-500/10 text-purple-500',
            committee_member: 'bg-green-500/10 text-green-500',
            donor: 'bg-blue-500/10 text-blue-500',
        }
        return colors[role] || 'bg-gray-500/10 text-gray-500'
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
                        <h1 className="text-3xl font-bold text-text-primary">Users Management</h1>
                        <p className="text-text-secondary mt-1">
                            Manage all users • {users.length} users
                        </p>
                    </div>
                    <Button variant="primary" onClick={() => navigate('/admin/users/create')} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                </div>

                <Card className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<Search className="h-4 w-4" />}
                        />
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="input"
                        >
                            <option value="all">All Roles</option>
                            <option value="system_admin">System Admin</option>
                            <option value="institution_admin">Institution Admin</option>
                            <option value="committee_member">Committee Member</option>
                            <option value="donor">Donor</option>
                        </select>
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

                {users.length > 0 ? (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-bg-hover">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-bg-hover transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar ? (
                                                        <img
                                                            src={`/storage/${user.avatar}`}
                                                            alt={user.name}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                                            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-text-primary">{user.name}</div>
                                                        <div className="text-sm text-text-muted">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.roles && user.roles.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.roles.map((role) => (
                                                            <span
                                                                key={role.id}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadge(role.name)}`}
                                                            >
                                                                {role.name.includes('admin') ? (
                                                                    <Shield className="h-3 w-3" />
                                                                ) : (
                                                                    <UserCog className="h-3 w-3" />
                                                                )}
                                                                {formatRoleName(role.name)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-text-muted text-sm">No role</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={getStatusBadge(user.status)}>
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-text-secondary">
                                                    {user.phone || 'No phone'}
                                                </div>
                                                <div className="text-sm text-text-muted">
                                                    {user.city || 'No location'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => handleEdit(user.id, e)}
                                                        className="p-2 text-text-secondary hover:text-primary hover:bg-bg-hover rounded-lg transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(user, e)}
                                                        className="p-2 text-text-secondary hover:text-danger hover:bg-bg-hover rounded-lg transition-colors"
                                                        title="Delete user"
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
                ) : (
                    <Card className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-4">
                            <UserCog className="h-8 w-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No users found</h3>
                        <p className="text-text-secondary mb-6">
                            Get started by adding your first user
                        </p>
                        <Button variant="primary" onClick={() => navigate('/admin/users/create')}>
                            Add User
                        </Button>
                    </Card>
                )}
            </div>
            {users.length > 0 && pagination.last_page > 1 && (
                <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    onPageChange={(page) => refetch(page)}
                />
            )}

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete User"
                message={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
                confirmText="Delete User"
                variant="danger"
                loading={deleteLoading}
            />
        </>
    )
}