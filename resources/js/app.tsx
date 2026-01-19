import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './bootstrap'

import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import AdminLayout from '@/layouts/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import Donations from '@/pages/admin/Donations'
import Users from '@/pages/admin/Users'
import Profile from '@/pages/admin/Profile'
import Campaigns from './pages/admin/Campaign'
import CampaignDetails from './pages/admin/CampaignDetails'
import UserEdit from '@/pages/admin/UserEdit'
import Institutions from './pages/admin/Institutions'
import UserCreate from './pages/admin/UserCreate'
import InstitutionDetails from './pages/admin/InstitutionDetails'


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <GuestRoute>
                                <Login />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <GuestRoute>
                                <Register />
                            </GuestRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="campaigns" element={<Campaigns />} />
                        <Route path="campaigns/:id" element={<CampaignDetails />} />
                        <Route path="donations" element={<Donations />} />
                        <Route path="users" element={<Users />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="institutions" element={<Institutions />} />
                        <Route path="institutions/:id" element={<InstitutionDetails />} />
                        <Route path="users/:id/edit" element={<UserEdit />} />
                        <Route path="users/create" element={<UserCreate />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/admin" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

const root = document.getElementById('root')
if (root) {
    ReactDOM.createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>
    )
}