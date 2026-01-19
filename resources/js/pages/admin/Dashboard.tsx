import { useEffect, useState } from 'react'
import { Heart, TrendingUp, Users, Target, ArrowUpRight, Calendar, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { Campaign, Donation } from '@/types'
import api from '@/components/helpers/api'

interface DashboardStats {
    total_raised: number
    active_campaigns: number
    total_donors: number
    total_goal: number
    total_campaigns: number
    total_institutions: number
}

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState<DashboardStats>({
        total_raised: 0,
        active_campaigns: 0,
        total_donors: 0,
        total_goal: 0,
        total_campaigns: 0,
        total_institutions: 0,
    })
    const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
    const [recentDonations, setRecentDonations] = useState<Donation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [campaignStatsRes, donationStatsRes, campaignsRes, donationsRes] = await Promise.all([
                api.get('/campaignStats'),
                api.get('/donations/stats'),
                api.get('/campaigns?per_page=5'),
                api.get('/donations?per_page=5'),
            ])

            setStats({
                ...campaignStatsRes.data.data,
                ...donationStatsRes.data.data,
                total_institutions: 3,
            })
            setRecentCampaigns(campaignsRes.data.data.data || [])
            setRecentDonations(donationsRes.data.data.data || [])
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
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
            title: 'Total Raised',
            value: `₱${stats.total_raised.toLocaleString()}`,
            icon: Heart,
            // trend: { value: 15, isPositive: true },
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'Active Campaigns',
            value: stats.active_campaigns,
            icon: Target,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Total Donors',
            value: stats.total_donors,
            icon: Users,
            // trend: { value: 8, isPositive: true },
            color: 'text-info',
            bgColor: 'bg-info/10',
        },
        {
            title: 'Institutions',
            value: stats.total_institutions,
            icon: Building2,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    Welcome back, {user?.first_name} 👋
                </h1>
                <p className="text-text-secondary">
                    Here's what's happening with your campaigns today
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                {/* {stat.trend &&  (
                                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend.isPositive ? 'text-success' : 'text-danger'}`}>
                                        {stat.trend.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4 rotate-180" />}
                                        {stat.trend.value}%
                                    </div>
                                )} */}
                            </div>
                            <div>
                                <p className="text-sm text-text-muted mb-1">{stat.title}</p>
                                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                            </div>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-text-primary">Recent Campaigns</h2>
                        <button
                            onClick={() => navigate('/admin/campaigns')}
                            className="text-sm text-primary hover:text-primary-hover font-medium"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentCampaigns.length > 0 ? recentCampaigns.map((campaign) => (
                            <div key={campaign.id} className="group cursor-pointer" onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-text-primary group-hover:text-primary transition-colors truncate flex-1">
                                        {campaign.title}
                                    </p>
                                    <Badge variant={campaign.status === 'active' ? 'success' : campaign.status === 'completed' ? 'info' : 'warning'}>
                                        {campaign.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-success to-success/80 transition-all"
                                            style={{ width: `${Math.min(campaign.progress_percentage || 0, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                                        {(campaign.progress_percentage || 0).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-text-muted">
                                    <span>₱{campaign.raised_amount.toLocaleString()} / ₱{campaign.goal_amount.toLocaleString()}</span>
                                    {campaign.days_left !== undefined && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {campaign.days_left} days left
                                        </span>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-text-muted py-8">No campaigns yet</p>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-text-primary">Recent Donations</h2>
                        <button
                            onClick={() => navigate('/admin/donations')}
                            className="text-sm text-primary hover:text-primary-hover font-medium"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentDonations.length > 0 ? recentDonations.map((donation) => (
                            <div key={donation.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Heart className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-text-primary truncate">
                                            {donation.donor_display_name || donation.donor_name || 'Anonymous'}
                                        </p>
                                        <p className="text-sm text-text-muted truncate">
                                            {donation.campaign?.title || 'Campaign'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="font-semibold text-success">
                                        ₱{Number(donation.amount).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {new Date(donation.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-text-muted py-8">No donations yet</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}