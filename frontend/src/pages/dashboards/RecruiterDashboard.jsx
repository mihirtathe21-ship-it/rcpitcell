import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Briefcase, Users, Plus, ChevronRight, TrendingUp,
  CheckCircle2, Search, Trash2, AlertTriangle, X, CalendarDays, DollarSign
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import toast from 'react-hot-toast'
import StudentProfileModal from '../../components/ui/StudentProfileModal'
import CompanyLogo from '../../components/ui/CompanyLogo'
import { getDaysUntilDeadline } from '../../utils/jobDeadline'

const formatDriveDate = date => {
  if (!date) return '—'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLE = {
  active:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  upcoming:  'bg-blue-100 text-blue-700 border border-blue-200',
  closed:    'bg-slate-100 text-slate-600 border border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
}

const APP_STATUS_STYLE = {
  applied:     'bg-slate-100 text-slate-600',
  shortlisted: 'bg-amber-100 text-amber-700',
  selected:    'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ jobTitle, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-[#1a2744] text-sm">Delete Drive</h3>
            <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-slate-300 hover:text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Are you sure you want to delete <span className="font-semibold text-[#1a2744]">"{jobTitle}"</span>? All applicant data for this drive will also be removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>
              : <><Trash2 className="w-4 h-4" />Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Home Tab ──────────────────────────────────────────────────────────────────
function Home({ jobs, stats, loading }) {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.companyName} · Recruiter
          </p>
        </div>
        <Link
          to="/jobs/new"
          className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post Drive
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Drives',  val: stats?.total        ?? '—', icon: Briefcase,    bg: 'bg-blue-50',    ic: 'text-blue-600',    border: 'border-blue-100' },
          { label: 'Active',     val: stats?.active       ?? '—', icon: TrendingUp,   bg: 'bg-emerald-50', ic: 'text-emerald-600', border: 'border-emerald-100' },
          { label: 'Applicants', val: stats?.applications ?? '—', icon: Users,        bg: 'bg-violet-50',  ic: 'text-violet-600',  border: 'border-violet-100' },
          { label: 'Hired',      val: stats?.hired        ?? '—', icon: CheckCircle2, bg: 'bg-amber-50',   ic: 'text-amber-600',   border: 'border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1a2744]">{loading ? '—' : s.val}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
              </div>
              <div className={`${s.bg} p-2.5 rounded-xl border ${s.border}`}>
                <s.icon className={`w-4 h-4 ${s.ic}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Drives */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1a2744]">My Drives</h2>
          <Link to="/recruiter-dashboard/drives"
            className="text-sm text-[#1a2744] hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No drives yet</p>
            <Link to="/jobs/new" className="text-sm text-[#1a2744] font-semibold mt-2 inline-block hover:text-blue-600 transition-colors">
              Post your first →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 4).map(job => {
              const daysLeft = getDaysUntilDeadline(job.lastDateToApply)
              const status = job.status === 'active' && daysLeft !== null && daysLeft < 0 ? 'closed' : job.status
              return (
                <div key={job._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50/30">
                  <Link to={`/jobs/${job._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <CompanyLogo src={job.logo} company={job.company} className="h-10 w-10 shrink-0 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800">{job.company}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{job.title} · {formatDriveDate(job.driveDate)}</span>
                    </span>
                  </Link>
                  <Link to={`/jobs/${job._id}/applicants`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700"><Users className="h-3.5 w-3.5 text-slate-400" />{job.applicantCount || 0}</Link>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.closed}`}>{status}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── My Drives Tab ─────────────────────────────────────────────────────────────
function MyDrives({ jobs, loading, onDelete }) {
  const [search, setSearch]       = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const filtered = jobs.filter(j =>
    !search ||
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    await onDelete(confirmId)
    setDeleting(false)
    setConfirmId(null)
  }

  const confirmJob = jobs.find(j => j._id === confirmId)

  return (
    <div className="space-y-5">

      {confirmId && (
        <DeleteConfirmModal
          jobTitle={confirmJob?.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a2744]">My Drives</h2>
          <p className="text-slate-400 text-sm mt-0.5">{jobs.length} posted</p>
        </div>
        <Link to="/jobs/new"
          className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors">
          <Plus className="w-4 h-4" />
          New Drive
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search drives..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a2744] placeholder-slate-400 focus:outline-none focus:border-[#1a2744] focus:bg-white transition-colors"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center"><Briefcase className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-700">No drives found</p><p className="mt-1 text-xs text-slate-500">Try another search or post a new drive.</p></div>
        ) : (
          <div className="space-y-3 p-4">
            {filtered.map(job => {
              const daysLeft = getDaysUntilDeadline(job.lastDateToApply)
              const status = job.status === 'active' && daysLeft !== null && daysLeft < 0 ? 'closed' : job.status
              return (
                <article key={job._id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link to={`/jobs/${job._id}`} className="flex min-w-0 items-center gap-3">
                      <CompanyLogo src={job.logo} company={job.company} className="h-11 w-11 shrink-0 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800">{job.company}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-600">{job.title}</span>
                        <span className="mt-1 block truncate text-[11px] text-slate-500">{job.location || 'On campus'} · {(job.type || 'full-time').replace('-', ' ')}</span>
                      </span>
                    </Link>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.closed}`}>{status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span>{job.package || job.stipend || 'Package not listed'}</span>
                      <span>Drive: {formatDriveDate(job.driveDate)}</span>
                      <span className={daysLeft !== null && daysLeft < 0 ? 'font-semibold text-rose-600' : ''}>Deadline: {job.lastDateToApply ? formatDriveDate(job.lastDateToApply) : 'Not specified'}</span>
                      <Link to={`/jobs/${job._id}/applicants`} className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-700"><Users className="h-3.5 w-3.5" />{job.applicantCount || 0} applicants</Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/jobs/${job._id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">View</Link>
                      <button type="button" onClick={() => setConfirmId(job._id)} aria-label={`Delete ${job.title} drive`} title="Delete drive" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Applicants Tab — NEW: inline applicant list with profile modal ─────────────
// This component is rendered when a recruiter visits /jobs/:id/applicants
// but you can also mount it as a tab. Wrap however fits your router.
export function ApplicantsView({ jobId }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [profileStudent, setProfileStudent] = useState(null)  // ← NEW

  useEffect(() => {
    if (!jobId) return
    api.get(`/jobs/${jobId}/applicants`)
      .then(({ data }) => setApplications(data.applications || []))
      .catch(() => toast.error('Failed to load applicants'))
      .finally(() => setLoading(false))
  }, [jobId])

  const updateStatus = async (appId, status) => {
    try {
      await api.patch(`/applications/${appId}/status`, { status })
      setApplications(prev =>
        prev.map(a => a._id === appId ? { ...a, status } : a)
      )
      toast.success(`Status updated to ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-4">

      {/* Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1a2744]">Applicants</h2>
        <p className="text-slate-400 text-sm">
          {applications.length} applicant{applications.length !== 1 ? 's' : ''}
          {' · '}
          <span className="text-blue-500 font-medium text-xs">Click a name to view full profile</span>
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-[11px] text-slate-400 px-5 py-3 font-semibold uppercase tracking-wide">Student</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide hidden sm:table-cell">Branch</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide">CGPA</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide">Status</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide">Profile</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide hidden md:table-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-3">
                  <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                </td></tr>
              ))
            ) : applications.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No applicants yet</p>
              </td></tr>
            ) : applications.map(app => {
              const s = app.student || {}
              return (
                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                  {/* Name — click to open profile */}
                  <td className="px-5 py-3 cursor-pointer" onClick={() => setProfileStudent(s)}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {s.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1a2744] hover:text-blue-600 transition-colors leading-tight">
                          {s.name || '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{s.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-slate-500">{s.branch || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${
                      !s.cgpa       ? 'text-slate-300'    :
                      s.cgpa >= 8.5 ? 'text-emerald-600' :
                      s.cgpa >= 7.5 ? 'text-blue-600'    :
                      s.cgpa >= 6.5 ? 'text-amber-600'   : 'text-red-500'
                    }`}>{s.cgpa ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${APP_STATUS_STYLE[app.status] || 'bg-slate-100 text-slate-500'}`}>
                      {app.status}
                    </span>
                  </td>
                  {/* View Profile button */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setProfileStudent(s)}
                      className="flex items-center gap-1 text-[11px] text-[#1a2744] font-semibold border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:text-blue-600 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Users className="w-3 h-3" />
                      View
                    </button>
                  </td>
                  {/* Status change */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <select
                      value={app.status}
                      onChange={e => updateStatus(app._id, e.target.value)}
                      className="text-xs border border-slate-200 bg-slate-50 rounded-lg px-2 py-1.5 text-[#1a2744] focus:outline-none focus:border-[#1a2744] transition-colors cursor-pointer"
                    >
                      {['applied', 'shortlisted', 'selected', 'rejected'].map(st => (
                        <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RecruiterDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState(null)

  useEffect(() => {
    api.get('/jobs')
      .then(async ({ data }) => {
        const mine = data.jobs.filter(j =>
          j.postedBy?._id === user?._id || j.postedBy === user?._id
        )
        setJobs(mine)

        let apps = 0, hired = 0
        await Promise.all(
          mine.slice(0, 5).map(async j => {
            try {
              const r = await api.get(`/jobs/${j._id}/applicants`)
              apps += r.data.total
              hired += r.data.applications.filter(a => a.status === 'selected').length
            } catch {}
          })
        )
        setStats({
          total: mine.length,
          active: mine.filter(j => j.status === 'active').length,
          applications: apps,
          hired,
        })
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    try {
      await api.delete(`/jobs/${id}`)
      setJobs(prev => prev.filter(j => j._id !== id))
      toast.success('Drive deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
      throw err
    }
  }

  const content = () => {
    if (location.pathname === '/recruiter-dashboard/drives')
      return <MyDrives jobs={jobs} loading={loading} onDelete={handleDelete} />
    return <Home jobs={jobs} stats={stats} loading={loading} />
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {content()}
      </div>
    </DashboardLayout>
  )
}
