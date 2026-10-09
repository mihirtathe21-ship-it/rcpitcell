import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, FileText, BarChart2, Bell,
  Users, LogOut, Menu, ChevronRight, GraduationCap, BookOpen,
  Building2, Shield, Upload, Search, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = {
  student: [
    { label: 'Dashboard',       icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Browse Jobs',     icon: Briefcase,        path: '/jobs' },
    { label: 'My Applications', icon: FileText,         path: '/applications' },
    { label: 'Prepare',         icon: Sparkles,         path: '/prepare',   highlight: true },
    { label: 'Notifications',   icon: Bell,             path: '/notifications' },
    { label: 'Previous Year Questions', icon: BookOpen, path: '/previous-year-questions' },
  ],
  tpo: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/tpo-dashboard' },
    { label: 'Drives',        icon: Briefcase,        path: '/jobs' },
    { label: 'Find Students', icon: Search,           path: '/tpo-dashboard/students' },
    { label: 'Upload Data',   icon: Upload,           path: '/tpo-dashboard/upload' },
    { label: 'Analytics',     icon: BarChart2,        path: '/analytics' },
    { label: 'Notifications', icon: Bell,             path: '/notifications' },
    { label: 'Previous Year Questions', icon: BookOpen, path: '/tpo-dashboard/questions' },
  ],
  recruiter: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/recruiter-dashboard' },
    { label: 'Post Drive',    icon: Briefcase,        path: '/jobs/new' },
    { label: 'My Drives',     icon: FileText,         path: '/recruiter-dashboard/drives' },
    { label: 'Candidates',    icon: Users,            path: '/recruiter-dashboard/candidates' },
    { label: 'Notifications', icon: Bell,             path: '/notifications' },
  ],
  admin: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/admin-dashboard' },
    { label: 'Users',         icon: Users,            path: '/admin-dashboard/users' },
    { label: 'Drives',        icon: Briefcase,        path: '/jobs' },
    { label: 'Analytics',     icon: BarChart2,        path: '/analytics' },
    { label: 'Notifications', icon: Bell,             path: '/notifications' },
    { label: 'Previous Year Questions', icon: BookOpen, path: '/previous-year-questions' },
  ],
}

const META = {
  student:   { label: 'Student',   Icon: GraduationCap },
  tpo:       { label: 'TPO',       Icon: Shield        },
  recruiter: { label: 'Recruiter', Icon: Building2     },
  admin:     { label: 'Admin',     Icon: Shield        },
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav  = NAV[user?.role]  || []
  const meta = META[user?.role] || META.student
  const isStudent = user?.role === 'student'
  const isTpo = user?.role === 'tpo'

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className={`flex h-full flex-col border-r ${isTpo ? 'border-slate-800 bg-[#10233f]' : 'border-slate-200 bg-white'}`}>

      <div className={`px-5 pt-6 pb-5 border-b ${isStudent ? 'border-slate-100 bg-white' : isTpo ? 'border-slate-700 bg-[#10233f]' : 'border-yellow-200 bg-[#FDE29A]'}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${isStudent ? 'bg-blue-600 text-white' : isTpo ? 'bg-amber-300 text-[#10233f]' : 'bg-white text-blue-600'}`}>
            <meta.Icon className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isTpo ? 'text-white' : 'text-slate-900'}`}>PlaceNext</p>
            <p className={`text-[10px] uppercase tracking-widest ${isStudent ? 'text-blue-600' : isTpo ? 'text-blue-200' : 'text-yellow-800'}`}>{isStudent ? 'Your career, your next step' : isTpo ? 'Training & placement' : meta.label}</p>
          </div>
        </div>
      </div>

      <div className={`border-b px-4 py-3 ${isTpo ? 'border-slate-700' : 'border-slate-100'}`}>
        <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isStudent ? 'border-slate-100 bg-slate-50' : isTpo ? 'border-slate-700 bg-slate-800/70' : 'border-blue-100 bg-blue-50'}`}>
          <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold ${isTpo ? 'bg-blue-500 text-white' : 'rounded-lg bg-blue-600 text-white'}`}>
            {user?.name?.charAt(0)?.toUpperCase()}
            {isTpo && user?.photo && <img src={user.photo} alt="" className="absolute inset-0 h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none' }} />}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-xs font-semibold ${isTpo ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
            <p className={`truncate text-[10px] ${isTpo ? 'text-slate-400' : 'text-slate-400'}`}>{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map(({ label, icon: Icon, path, highlight }) => {
          const active = location.pathname === path ||
            (path !== '/tpo-dashboard' && location.pathname.startsWith(path + '/'))
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              title={label}
              className={isStudent
                ? `flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-sm transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700'
                      : highlight
                        ? 'border-transparent font-medium text-slate-700 hover:bg-blue-50'
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                : isTpo
                  ? `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? 'bg-blue-600 font-semibold text-white shadow-sm shadow-blue-950/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                : `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    active
                      ? 'bg-blue-600 font-semibold text-white shadow-sm'
                      : highlight
                        ? 'font-medium text-gray-700 hover:bg-[#fffdf4]'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {highlight && !active && (
                <span className="ml-auto text-[9px] bg-[#FDE29A] text-gray-900 px-1.5 py-0.5 rounded-full font-semibold">
                  NEW
                </span>
              )}
              {active && <ChevronRight className={`ml-auto h-3.5 w-3.5 ${isStudent ? 'text-blue-500' : 'text-blue-200'}`} />}
            </Link>
          )
        })}
      </nav>

      {isStudent && (
        <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold text-slate-800">Build your future</p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Explore preparation resources and take your next step.</p>
          <Link to="/prepare" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900">
            Explore preparation <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div className={`border-t px-3 py-3 ${isTpo ? 'border-slate-700' : 'border-slate-100'}`}>
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${isTpo ? 'text-slate-300 hover:bg-red-500/10 hover:text-red-300' : 'text-slate-500 hover:bg-red-50 hover:text-red-500'}`}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">

      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col lg:flex ${isStudent ? 'w-64' : 'w-56'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className={`absolute bottom-0 left-0 top-0 z-50 ${isStudent ? 'w-64' : 'w-60'}`}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className={`flex min-h-screen flex-1 flex-col ${isStudent ? 'lg:ml-64' : 'lg:ml-56'}`}>

        <div className={`sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 lg:hidden ${isStudent || isTpo ? 'border-slate-200 bg-white' : 'border-yellow-200 bg-[#FDE29A]'}`}>
          <button onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5 text-slate-800" />
          </button>
          <span className="font-bold text-slate-900">{isStudent || isTpo ? 'PlaceNext' : 'RCPIT'}</span>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}