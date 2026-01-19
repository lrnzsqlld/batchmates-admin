export interface User {
  id: number
  institution_id?: number
  institution?: Institution
  first_name: string
  last_name: string
  name: string
  email: string
  phone?: string
  bio?: string
  avatar?: string
  address?: string
  city?: string
  country?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  roles: Role[]
  permissions: Permission[]
  status: 'active' | 'suspended' | 'pending'
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface Role {
  id: number
  name: string
  guard_name: string
}

export interface Permission {
  id: number
  name: string
  guard_name: string
}

export interface Campaign {
  id: number
  institution_id: number
  created_by: number
  beneficiary_id?: number
  title: string
  description: string
  image?: string
  goal_amount: number
  raised_amount: number
  campaign_type: 'general' | 'individual'
  status: 'pending_review' | 'approved' | 'rejected' | 'active' | 'completed' | 'closed'
  priority: 'normal' | 'urgent'
  end_date?: string
  approved_by?: number
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  creator?: User
  beneficiary?: User
  institution?: Institution
  donations?: Donation[]
  donations_count?: number
  days_left?: number
  progress_percentage?: number
  available_balance?: number
  bank_account_id?: number
}

export interface Stats {
  total_campaigns: number
  active_campaigns: number
  total_raised: number
  total_goal: number
  total_donors: number
}

export interface Donation {
  id: number
  campaign_id: number
  user_id?: number
  donor_id?: number
  donor_name?: string
  donor_email?: string
  donor_display_name?: string
  amount: number | string
  status: 'pending' | 'completed' | 'failed'
  payment_method: string
  transaction_id?: string
  is_anonymous: boolean
  message?: string
  created_at: string
  campaign?: {
    id: number
    title: string
  }
  user?: User
}

export interface Institution {
  id: number
  name: string
  slug: string
  logo?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  status: 'active' | 'suspended' | 'pending'
  settings?: any
  created_at: string
  updated_at: string
  users_count?: number
  campaigns_count?: number
}

export interface InstitutionStats {
  total_users: number
  total_campaigns: number
  active_campaigns: number
  total_raised: number
  total_donations: number
  total_committees: number
  active_committees: number
}

export interface BankAccount {
  id?: number
  committee_id?: number
  institution_id?: number
  bank_name: string
  account_number: string
  account_holder: string
  swift_code?: string
  branch?: string
  is_primary: boolean
  status: 'active' | 'inactive'
  effective_from: string
  effective_until?: string
  created_at?: string
  updated_at?: string
  masked_account_number?: string
}