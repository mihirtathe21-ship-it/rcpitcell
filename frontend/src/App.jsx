import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginPage        from './pages/auth/LoginPage'
import RegisterPage     from './pages/auth/RegisterPage'
import StudentDashboard from './pages/dashboards/StudentDashboard'
import PreparePage from './pages/student/PreparePage'
import TPODashboard     from './pages/dashboards/TPODashboard'
import RecruiterDashboard from './pages/dashboards/RecruiterDashboard'
import AdminDashboard   from './pages/dashboards/AdminDashboard'
import JobsPage         from './pages/jobs/JobsPage'
import JobDetailPage    from './pages/jobs/JobDetailPage'
import PostJobPage      from './pages/jobs/PostJobPage'
import MyApplicationsPage from './pages/applications/MyApplicationsPage'
import ApplicantsPage   from './pages/applications/ApplicantsPage'
import AnalyticsPage    from './pages/analytics/AnalyticsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import CompanyQuestionsPage from './pages/questions/CompanyQuestionsPage'
import DashboardLayout from './components/layout/DashboardLayout'


const ROLE_HOME = {
  student:   '/student-dashboard',
  tpo:       '/tpo-dashboard',
  recruiter: '/recruiter-dashboard',
  admin:     '/admin-dashboard',
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role)) {
    return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />
  }
  return children
}

function Root() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0c1221',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.07)',
              fontSize: '13px',
            },
          }}
        />
        <Routes>
          {/* ── Public ── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Student ── */}
          <Route path="/student-dashboard" element={
            <PrivateRoute><RoleRoute roles={['student']}><StudentDashboard /></RoleRoute></PrivateRoute>
          } />

          {/* ── TPO (all sub-routes render TPODashboard, tab switching via location.pathname) ── */}
          <Route path="/tpo-dashboard" element={
            <PrivateRoute><RoleRoute roles={['tpo']}><TPODashboard /></RoleRoute></PrivateRoute>
          } />
          <Route path="/tpo-dashboard/students" element={
            <PrivateRoute><RoleRoute roles={['tpo']}><TPODashboard /></RoleRoute></PrivateRoute>
          } />
          <Route path="/tpo-dashboard/upload" element={
            <PrivateRoute><RoleRoute roles={['tpo']}><TPODashboard /></RoleRoute></PrivateRoute>
          } />
          <Route path="/tpo-dashboard/questions" element={
            <PrivateRoute><RoleRoute roles={['tpo']}><TPODashboard /></RoleRoute></PrivateRoute>
          } />

          {/* ── Recruiter ── */}
          <Route path="/recruiter-dashboard" element={
            <PrivateRoute><RoleRoute roles={['recruiter']}><RecruiterDashboard /></RoleRoute></PrivateRoute>
          } />
          <Route path="/recruiter-dashboard/drives" element={
            <PrivateRoute><RoleRoute roles={['recruiter']}><RecruiterDashboard /></RoleRoute></PrivateRoute>
          } />

          {/* ── Admin ── */}
          <Route path="/admin-dashboard" element={
            <PrivateRoute><RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute></PrivateRoute>
          } />
          <Route path="/admin-dashboard/users" element={
            <PrivateRoute><RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute></PrivateRoute>
          } />

          {/* ── Jobs ── */}
          <Route path="/jobs" element={
            <PrivateRoute><JobsPage /></PrivateRoute>
          } />
          <Route path="/jobs/new" element={
            <PrivateRoute>
              <RoleRoute roles={['tpo', 'recruiter', 'admin']}><PostJobPage /></RoleRoute>
            </PrivateRoute>
          } />
          <Route path="/jobs/:id" element={
            <PrivateRoute><JobDetailPage /></PrivateRoute>
          } />
          <Route path="/jobs/:id/applicants" element={
            <PrivateRoute>
              <RoleRoute roles={['tpo', 'recruiter', 'admin']}><ApplicantsPage /></RoleRoute>
            </PrivateRoute>
          } />

          {/* ── Other ── */}
          <Route path="/applications" element={
            <PrivateRoute><RoleRoute roles={['student']}><MyApplicationsPage /></RoleRoute></PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute><RoleRoute roles={['admin', 'tpo']}><AnalyticsPage /></RoleRoute></PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute><NotificationsPage /></PrivateRoute>
          } />
          <Route path="/previous-year-questions" element={
            <PrivateRoute>
              <DashboardLayout><CompanyQuestionsPage /></DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/prepare" element={<PreparePage />} />
          
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* ── Default ── */}
          <Route path="/"  element={<Root />} />
          <Route path="*"  element={<Root />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}