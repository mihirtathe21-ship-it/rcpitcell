import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award, Briefcase, Calendar, CheckCircle2, ChevronRight,
  Clock, DollarSign, GraduationCap, LayoutGrid, List, MapPin, Plus,
  Search, Users, XCircle, Zap,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import CompanyLogo from '../../components/ui/CompanyLogo'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import toast from 'react-hot-toast'
import { getDaysUntilDeadline } from '../../utils/jobDeadline'

const STATUS_STYLE = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
}

const APP_STYLE = {
  applied: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-amber-100 text-amber-700',
  interview: 'bg-violet-100 text-violet-700',
  selected: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-600',
}

const STATUS_ICONS = { active: Zap, upcoming: Clock, closed: XCircle, cancelled: XCircle }

function isEligible(user, job) {
  const eligibility = job.eligibility
  if (!eligibility) return true
  if (eligibility.minCGPA > 0 && (user.cgpa || 0) < eligibility.minCGPA) return false
  if (eligibility.branches?.length > 0 && !eligibility.branches.includes(user.branch)) return false
  if (eligibility.passingYear?.length > 0 && !eligibility.passingYear.includes(Number(user.passingYear))) return false
  return true
}

function formatDate(date) {
  if (!date) return '—'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState('grid')

  const isManagement = ['admin', 'tpo', 'recruiter'].includes(user?.role)
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index)
  }, [page, totalPages])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const fetchJobs = useCallback(async signal => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (debouncedSearch) params.search = debouncedSearch
      if (filterStatus) params.status = filterStatus
      if (filterType) params.type = filterType
      const { data } = await api.get('/jobs', { params, signal })
      setJobs(data.jobs || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (error) {
      if (error.name !== 'CanceledError') toast.error(error.response?.data?.message || 'Failed to load jobs')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page, debouncedSearch, filterStatus, filterType])

  useEffect(() => {
    const controller = new AbortController()
    fetchJobs(controller.signal)
    return () => controller.abort()
  }, [fetchJobs])

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setFilterStatus('')
    setFilterType('')
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <header className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {isManagement ? 'Placement Drives' : 'Explore Opportunities'}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Briefcase className="h-4 w-4 text-blue-600" />
                {total} {total === 1 ? 'drive available' : 'drives available'}
              </p>
            </div>
            {isManagement && (
              <Link to="/jobs/new" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Post New Drive
              </Link>
            )}
          </header>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Search and filter drives">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search by company, role, or location..."
                  aria-label="Search placement drives"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="jobs-status-filter">Filter by status</label>
                <select id="jobs-status-filter" value={filterStatus} onChange={event => { setFilterStatus(event.target.value); setPage(1) }} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <label className="sr-only" htmlFor="jobs-type-filter">Filter by job type</label>
                <select id="jobs-type-filter" value={filterType} onChange={event => { setFilterType(event.target.value); setPage(1) }} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400">
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
                <div className="flex gap-1 rounded-xl bg-gray-100 p-1" role="group" aria-label="Drive view mode">
                  <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode === 'grid'} className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode === 'list'} className={`rounded-lg p-2 transition ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><List className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            {(search || filterStatus || filterType) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-500">Filters:</span>
                {filterStatus && <button type="button" onClick={() => { setFilterStatus(''); setPage(1) }} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Status: {filterStatus} ×</button>}
                {filterType && <button type="button" onClick={() => { setFilterType(''); setPage(1) }} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Type: {filterType} ×</button>}
                {search && <button type="button" onClick={() => setSearch('')} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Search: {search} ×</button>}
                <button type="button" onClick={clearFilters} className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-800">Clear all</button>
              </div>
            )}
          </section>

          {loading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white p-5"><div className="h-10 w-10 rounded-xl bg-gray-100" /><div className="mt-4 h-4 w-2/3 rounded bg-gray-100" /><div className="mt-3 h-3 w-1/2 rounded bg-gray-100" /></div>)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-base font-semibold text-gray-700">No drives found</p>
              <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filters.</p>
              {(search || filterStatus || filterType) && <button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900">Clear filters</button>}
            </div>
          ) : (
            <section className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`} aria-label="Placement drives">
              {jobs.map(job => {
                const eligible = isManagement ? true : isEligible(user || {}, job)
                const daysLeft = getDaysUntilDeadline(job.lastDateToApply)
                const status = job.status === 'active' && daysLeft !== null && daysLeft < 0 ? 'closed' : job.status
                const StatusIcon = STATUS_ICONS[status] || XCircle
                const deadlineLabel = daysLeft === null
                  ? 'Applications open'
                  : daysLeft < 0
                    ? 'Deadline passed'
                    : daysLeft === 0
                      ? 'Apply by today'
                      : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to apply`
                const compact = viewMode === 'list'

                return (
                  <article key={job._id} className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${!eligible && !isManagement ? 'opacity-80' : ''}`}>
                    <div className={`p-5 ${compact ? 'flex flex-col gap-4 sm:flex-row sm:items-center' : ''}`}>
                      <div className={`flex items-start justify-between gap-3 ${compact ? 'sm:w-[35%]' : ''}`}>
                        <Link to={`/jobs/${job._id}`} className="flex min-w-0 items-center gap-3">
                          <CompanyLogo src={job.logo} company={job.company} className="h-12 w-12 rounded-xl border border-amber-100 bg-[#FDE29A] p-1 text-lg font-bold text-gray-900" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-gray-900 transition group-hover:text-blue-700">{job.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-gray-500">{job.company}</span>
                          </span>
                        </Link>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.closed}`}>
                          <StatusIcon className="h-3 w-3" /> {status}
                        </span>
                      </div>

                      <div className={`mt-4 flex flex-wrap gap-2 ${compact ? 'sm:mt-0 sm:flex-1' : ''}`}>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] text-gray-600"><Briefcase className="h-3.5 w-3.5" />{(job.type || 'full-time').replace('-', ' ')}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] text-gray-600"><MapPin className="h-3.5 w-3.5" />{job.location || 'On campus'}</span>
                        {(job.package || job.stipend) && <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700"><DollarSign className="h-3.5 w-3.5" />{job.package || job.stipend}</span>}
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-1.5 ${compact ? 'sm:mt-0 sm:flex-1' : ''}`}>
                        {job.eligibility?.minCGPA > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-600"><Award className="h-3 w-3" /> CGPA ≥ {job.eligibility.minCGPA}</span>}
                        {job.eligibility?.branches?.slice(0, compact ? 4 : 2).map(branch => <span key={branch} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-600"><GraduationCap className="h-3 w-3" />{branch.split(' ')[0]}</span>)}
                        {job.eligibility?.branches?.length > (compact ? 4 : 2) && <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500">+{job.eligibility.branches.length - (compact ? 4 : 2)}</span>}
                      </div>

                      <div className={`mt-3 flex items-center gap-1.5 text-xs ${daysLeft !== null && daysLeft < 0 ? 'font-semibold text-rose-600' : daysLeft !== null && daysLeft <= 3 ? 'font-semibold text-amber-600' : 'text-gray-500'}`}>
                        <Calendar className="h-3.5 w-3.5 text-gray-400" /> {job.lastDateToApply ? `${deadlineLabel} · ${formatDate(job.lastDateToApply)}` : deadlineLabel}
                      </div>

                      <div className={`mt-4 flex items-center justify-between border-t border-gray-100 pt-3 ${compact ? 'sm:mt-0 sm:w-52 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0' : ''}`}>
                        <div>
                          {isManagement ? (
                            <Link to={`/jobs/${job._id}/applicants`} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-blue-700"><Users className="h-3.5 w-3.5" />{job.applicantCount || 0} Applicants</Link>
                          ) : job.applicationStatus ? (
                            <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold capitalize ${APP_STYLE[job.applicationStatus] || 'bg-gray-100 text-gray-600'}`}>{job.applicationStatus}</span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${eligible ? 'text-emerald-600' : 'text-red-500'}`}>
                              {eligible ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                              {eligible ? 'Eligible' : 'Not Eligible'}
                            </span>
                          )}
                        </div>
                        <Link to={`/jobs/${job._id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 transition hover:text-blue-700">View Details <ChevronRight className="h-3.5 w-3.5" /></Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>
          )}

          {!loading && totalPages > 1 && (
            <nav aria-label="Drive pages" className="flex items-center justify-center gap-2 pt-1">
              <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">Previous</button>
              {pageNumbers.map(pageNumber => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? 'page' : undefined} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${page === pageNumber ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>{pageNumber}</button>)}
              <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">Next</button>
            </nav>
          )}
        </main>
      </div>
    </DashboardLayout>
  )
}
