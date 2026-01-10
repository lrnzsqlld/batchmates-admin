import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './bootstrap'

import AdminLayout from '@/layouts/AdminLayout'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
// import Dashboard from '@/pages/admin/Dashboard'
// import Users from '@/pages/admin/Users'
// import Institutions from '@/pages/admin/Institutions'
// import Students from '@/pages/admin/Students'
// import Donations from '@/pages/admin/Donations'

import { AuthProvider } from '@/contexts/AuthContext'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/admin" element={<AdminLayout />}>
                        {/* <Route index element={<Dashboard />} />
                        <Route path="users" element={<Users />} />
                        <Route path="institutions" element={<Institutions />} />
                        <Route path="students" element={<Students />} />
                        <Route path="donations" element={<Donations />} /> */}
                    </Route>

                    <Route path="/" element={<Navigate to="/login" replace />} />
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