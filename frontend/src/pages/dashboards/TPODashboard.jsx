import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  GraduationCap, Briefcase, Upload, BookOpen,
  Search, SlidersHorizontal, RefreshCw, CheckCircle2,
  Download, FileSpreadsheet, Users, Award,
  UserCheck, X, Plus, AlertCircle, Activity, ArrowRight,
  CalendarDays, ChevronRight, Clock3, ImagePlus,
  ShieldCheck, Sparkles, Bell,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import toast from 'react-hot-toast'
import StudentProfileModal from '../../components/ui/StudentProfileModal'
import CompanyQuestionsPage from '../questions/CompanyQuestionsPage'
import CompanyLogo from '../../components/ui/CompanyLogo'
import { getDaysUntilDeadline } from '../../utils/jobDeadline'

const formatDate = date => {
  if (!date) return '—'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getAcademicYear = date => {
  const year = date.getFullYear()
  const start = date.getMonth() >= 5 ? year : year - 1
  return `${start}-${String(start + 1).slice(-2)}`
}

const APPLICATION_STATUS_STYLE = {
  applied: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-amber-50 text-amber-700',
  interview: 'bg-violet-50 text-violet-700',
  selected: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  withdrawn: 'bg-slate-100 text-slate-600',
}

const DOMAINS = [
  'Full Stack Development',
  'Frontend Development',
  'Backend Development',
  'Data Analytics',
  'Data Science',
  'Machine Learning',
  'Artificial Intelligence',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
  'Mobile Development',
  'UI/UX Design',
  '.NET Development',
  'Java Development',
  'Python Development',
  'Embedded Systems',
  'Networking',
  'Database Administration',
  'Other',
]

// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────────────────
function HomeTab() {
  const { user, updateUser } = useAuth()
  const [summary, setSummary] = useState(null)
  const [recentApps, setRecentApps] = useState([])
  const [recentDrives, setRecentDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(user?.photo || '')

  useEffect(() => {
    setPhotoPreview(user?.photo || '')
  }, [user?.photo])

  useEffect(() => () => {
    if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      setLoading(true)
      const results = await Promise.allSettled([
        api.get('/analytics/summary'),
        api.get('/applications', { params: { limit: 6 } }),
        api.get('/jobs', { params: { limit: 6 } }),
      ])

      if (!mounted) return
      if (results[0].status === 'fulfilled') setSummary(results[0].value.data)
      else toast.error('Could not load placement summary.')
      if (results[1].status === 'fulfilled') setRecentApps(results[1].value.data.applications || [])
      else toast.error('Could not load recent applications.')
      if (results[2].status === 'fulfilled') setRecentDrives(results[2].value.data.jobs || [])
      else toast.error('Could not load recent drives.')
      setLoading(false)
    }

    loadDashboard()
    return () => { mounted = false }
  }, [])

  const handlePhotoChange = async event => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, or WEBP profile photo.')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be smaller than 2 MB.')
      event.target.value = ''
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPhotoPreview(localPreview)
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const { data } = await api.put('/users/profile', formData)
      updateUser(data.user)
      toast.success('TPO profile photo updated.')
    } catch (error) {
      setPhotoPreview(user?.photo || '')
      toast.error(error.response?.data?.message || 'Could not update your profile photo.')
    } finally {
      URL.revokeObjectURL(localPreview)
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const visibleDrives = recentDrives.filter(job =>
    `${job.company || ''} ${job.title || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  )
  const stats = [
    { label: 'Registered students', value: summary?.totalStudents, icon: GraduationCap, tone: 'blue', to: '/tpo-dashboard/students' },
    { label: 'Active drives', value: summary?.activeJobs, icon: Briefcase, tone: 'emerald', to: '/jobs' },
    { label: 'Applications', value: summary?.totalApplications, icon: FileSpreadsheet, tone: 'violet', to: '/applications' },
    { label: 'Selected applications', value: summary?.selectedApplications, icon: Award, tone: 'amber', to: '/analytics' },
  ]
  const quickActions = [
    { label: 'Post a placement drive', detail: 'Create a new company opportunity', icon: Briefcase, to: '/jobs/new', theme: 'blue' },
    { label: 'Find students', detail: 'Filter and shortlist candidates', icon: GraduationCap, to: '/tpo-dashboard/students', theme: 'emerald' },
    { label: 'Upload student data', detail: 'Import a student CSV or workbook', icon: Upload, to: '/tpo-dashboard/upload', theme: 'violet' },
    { label: 'Previous-year questions', detail: 'Manage company interview questions', icon: BookOpen, to: '/tpo-dashboard/questions', theme: 'amber' },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <label className="relative min-w-[220px] flex-1 sm:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search recent drives..." aria-label="Search recent placement drives" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50" />
        </label>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 sm:inline-flex">
            <CalendarDays className="h-4 w-4 text-blue-600" /> Academic year {getAcademicYear(new Date())}
          </span>
          <Link to="/notifications" aria-label="Open notifications" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700">
            <Bell className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
              {user?.name?.trim()?.charAt(0)?.toUpperCase() || 'T'}
              {photoPreview && <img src={photoPreview} alt="" className="absolute inset-0 h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none' }} />}
            </div>
            <div className="hidden max-w-40 sm:block">
              <p className="truncate text-xs font-semibold text-slate-800">{user?.name || 'Placement officer'}</p>
              <p className="text-[11px] text-slate-500">Training &amp; Placement</p>
            </div>
            <label title="Upload profile photo" className={`ml-1 cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 ${uploadingPhoto ? 'animate-pulse' : ''}`}>
              <ImagePlus className="h-4 w-4" />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={uploadingPhoto} className="sr-only" aria-label="Upload TPO profile photo" />
            </label>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-indigo-50 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-14 -z-10 h-56 w-56 rounded-full border-[32px] border-white/70" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 -z-10 h-24 w-1/3 bg-gradient-to-l from-blue-100/70 to-transparent" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700"><ShieldCheck className="h-3.5 w-3.5" /> Training &amp; Placement Office</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#142445] sm:text-3xl">TPO Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Welcome{user?.name ? `, ${user.name.trim().split(/\s+/)[0]}` : ''}. Keep placement drives, student applications, and recruitment activity moving from one place.</p>
          </div>
          <Link to="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Post a drive <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Placement overview">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.to} className={`group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
            stat.tone === 'blue' ? 'border-blue-100' :
            stat.tone === 'emerald' ? 'border-emerald-100' :
            stat.tone === 'violet' ? 'border-violet-100' : 'border-amber-100'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                stat.tone === 'blue' ? 'bg-blue-50 text-blue-700' :
                stat.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                stat.tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'
              }`}><stat.icon className="h-5 w-5" /></div>
              <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-[#142445]">{loading || stat.value == null ? '—' : stat.value.toLocaleString()}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Briefcase className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-semibold text-[#142445]">Recent recruitment drives</h2><p className="mt-0.5 text-xs text-slate-500">Latest drives saved in the system</p></div>
            </div>
            <Link to="/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[1, 2, 3, 4].map(item => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : visibleDrives.length === 0 ? (
            <div className="px-5 py-12 text-center"><Briefcase className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-700">{search ? 'No matching drives' : 'No placement drives yet'}</p><p className="mt-1 text-xs text-slate-500">{search ? 'Try a different company or role.' : 'Post the first drive to start building your placement pipeline.'}</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleDrives.slice(0, 6).map(job => {
                const daysLeft = getDaysUntilDeadline(job.lastDateToApply)
                const status = job.status === 'active' && daysLeft !== null && daysLeft < 0 ? 'closed' : job.status
                return (
                  <div key={job._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-blue-50/30">
                    <Link to={`/jobs/${job._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <CompanyLogo src={job.logo} company={job.company} className="h-10 w-10 shrink-0 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-800">{job.company}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-500">{job.title} · {job.location || 'On campus'}</span>
                      </span>
                    </Link>
                    <span className="text-xs font-medium text-slate-600">{job.package || job.stipend || 'Package not listed'}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                      status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      status === 'upcoming' ? 'bg-violet-50 text-violet-700' :
                      status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>{status}</span>
                    <Link to={`/jobs/${job._id}/applicants`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700" aria-label={`${job.applicantCount || 0} applicants for ${job.company}`}><Users className="h-3.5 w-3.5 text-slate-400" />{job.applicantCount || 0}</Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Activity className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-semibold text-[#142445]">Application activity</h2><p className="mt-0.5 text-xs text-slate-500">Latest student submissions</p></div>
            </div>
            <Link to="/applications" aria-label="View all applications" className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"><ArrowRight className="h-4 w-4" /></Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(item => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : recentApps.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-10 text-center"><Users className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-700">No applications yet</p><p className="mt-1 text-xs text-slate-500">Applications will appear here as students apply.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApps.slice(0, 5).map(app => (
                <div key={app._id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-xs font-bold text-blue-700">{app.student?.name?.trim()?.charAt(0)?.toUpperCase() || '?'}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{app.student?.name || 'Unknown student'}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{app.job?.company || 'Placement drive'} · {app.job?.title || 'Application'}</p></div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${APPLICATION_STATUS_STYLE[app.status] || 'bg-slate-100 text-slate-600'}`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/applications" className="mt-2 flex items-center justify-center gap-1 border-t border-slate-100 pt-3 text-xs font-semibold text-blue-700 hover:text-blue-900">Open applications <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold text-[#142445]">Placement office tools</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(action => (
            <Link key={action.label} to={action.to} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                action.theme === 'blue' ? 'bg-blue-50 text-blue-700' :
                action.theme === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                action.theme === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'
              }`}><action.icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{action.label}</span><span className="mt-1 block truncate text-[10px] text-slate-500">{action.detail}</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" /> PlaceNext · Training &amp; Placement Office</span>
        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Dashboard overview</span>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD TAB  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function UploadTab() {
  const [rows, setRows]             = useState([])
  const [headers, setHeaders]       = useState([])
  const [fileName, setFileName]     = useState('')
  const [uploading, setUploading]   = useState(false)
  const [result, setResult]         = useState(null)
  const [dragOver, setDragOver]     = useState(false)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef()

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return { headers: [], rows: [] }
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const data = lines.slice(1)
      .filter(l => l.trim())
      .map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const obj = {}
        hdrs.forEach((h, i) => { obj[h] = vals[i] || '' })
        return obj
      })
    return { headers: hdrs, rows: data }
  }

  const parseXLSX = async (file) => {
    return new Promise((resolve, reject) => {
      const tryParse = (XLSX) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const wb   = XLSX.read(e.target.result, { type: 'binary' })
            const ws   = wb.Sheets[wb.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
            if (!json || json.length < 2) { reject(new Error('File is empty')); return }
            const hdrs = json[0].map(h => String(h).trim()).filter(Boolean)
            const data = json.slice(1)
              .filter(row => row.some(c => c !== ''))
              .map(row => {
                const obj = {}
                hdrs.forEach((h, idx) => { obj[h] = row[idx] ?? '' })
                return obj
              })
            resolve({ headers: hdrs, rows: data })
          } catch (err) { reject(err) }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsBinaryString(file)
      }

      if (window.XLSX) {
        tryParse(window.XLSX)
      } else {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
        script.onload = () => tryParse(window.XLSX)
        script.onerror = () => reject(new Error('Could not load Excel parser'))
        document.head.appendChild(script)
      }
    })
  }

  const handleFile = async (file) => {
    if (!file) return
    setParseError(''); setResult(null); setRows([]); setHeaders([])
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const { headers: hdrs, rows: data } = parseCSV(e.target.result)
          if (!hdrs.length) { setParseError('CSV file is empty or invalid'); return }
          setHeaders(hdrs); setRows(data); setFileName(file.name)
          toast.success(`${data.length} rows loaded`)
        } catch (err) { setParseError('Failed to parse CSV: ' + err.message) }
      }
      reader.readAsText(file)
    } else if (['xlsx', 'xls'].includes(ext)) {
      try {
        const { headers: hdrs, rows: data } = await parseXLSX(file)
        setHeaders(hdrs); setRows(data); setFileName(file.name)
        toast.success(`${data.length} rows loaded from ${file.name}`)
      } catch (err) {
        setParseError('Failed to parse Excel: ' + err.message + '. Try saving as CSV instead.')
        toast.error('Failed to parse Excel file')
      }
    } else {
      setParseError('Please upload a .xlsx, .xls, or .csv file')
    }
  }

  const handleInputChange = (e) => { handleFile(e.target.files?.[0]); e.target.value = '' }
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }

  const handleUpload = async () => {
    if (!rows.length) { toast.error('No data to upload'); return }
    setUploading(true)
    try {
      const { data } = await api.post('/students/import', { students: rows })
      setResult(data)
      toast.success(`${data.created} students added, ${data.updated} updated!`)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed')
    } finally { setUploading(false) }
  }

  const downloadTemplate = () => {
    const csv = [
      'Name,Email,Phone,RollNumber,Branch,PassingYear,CGPA,Backlogs,Domain',
      'Jane Doe,jane@college.edu,9876543210,CS2001,Computer Science,2025,8.5,0,Full Stack Development',
      'John Smith,john@college.edu,9876543211,IT2002,Information Technology,2025,7.2,1,Data Analytics',
      'Priya Patel,priya@college.edu,9876543212,EC2003,Electronics,2026,9.1,0,Machine Learning',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'student_template.csv'
    a.click(); URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[#1a2744]">Upload Student Data</h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload Excel or CSV once — data is permanently stored in the database.
          After this, use <strong className="text-emerald-600">Find Students</strong> tab to filter and shortlist anytime.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1a2744]">Download template first</p>
          <p className="text-xs text-slate-400">CSV with all columns including Domain &amp; Specialization</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-300 bg-white px-3 py-1.5 rounded-lg transition-all shrink-0 font-medium shadow-sm">
          <Download className="w-3.5 h-3.5" />Download CSV Template
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400">Supported:</span>
        {['.xlsx', '.xls', '.csv'].map(f => (
          <span key={f} className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md font-mono">{f}</span>
        ))}
        <span className="text-xs text-slate-300 ml-1">· Include a "Domain" column for specialization</span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-14 text-center cursor-pointer transition-all select-none ${
          dragOver    ? 'border-violet-400 bg-violet-50' :
          rows.length ? 'border-emerald-400 bg-emerald-50' :
                        'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50'
        }`}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleInputChange} className="hidden" />
        {rows.length > 0 ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-[#1a2744] font-semibold">{fileName}</p>
            <p className="text-emerald-600 text-sm mt-1">{rows.length} students loaded · Click to change</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Click to select file or drag &amp; drop here</p>
            <p className="text-slate-300 text-xs mt-1">Excel (.xlsx, .xls) or CSV files</p>
          </>
        )}
      </div>

      {parseError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-600">File Error</p>
            <p className="text-xs text-red-400 mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {rows.length > 0 && headers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-[#1a2744]">{rows.length} students ready to upload</span>
            <span className="text-slate-400 text-xs">preview: first 5 rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {headers.map(h => (
                    <th key={h} className="text-left text-[11px] text-slate-400 px-4 py-2.5 font-semibold whitespace-nowrap uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {headers.map(h => (
                      <td key={h} className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{String(row[h] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 5 && (
            <p className="text-center text-slate-400 text-xs py-2.5 border-t border-slate-100 bg-slate-50">
              + {rows.length - 5} more rows
            </p>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <button onClick={handleUpload} disabled={uploading}
          className="w-full py-3.5 bg-[#1a2744] hover:bg-[#243460] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
          {uploading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving to database...</>
          ) : (
            <><Upload className="w-4 h-4" />Save {rows.length} Students to Database</>
          )}
        </button>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-700">Upload Complete — Data saved permanently</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { val: result.created, label: 'New Students', c: 'text-emerald-600' },
              { val: result.updated, label: 'Updated',      c: 'text-blue-600' },
              { val: result.failed,  label: 'Failed',       c: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-emerald-100 rounded-xl py-3 shadow-sm">
                <p className={`text-2xl font-bold ${s.c}`}>{s.val}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
            </div>
          )}
          <Link to="/tpo-dashboard/students"
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-sm">
            <GraduationCap className="w-4 h-4" />Go to Find Students →
          </Link>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FIND STUDENTS TAB — with domain filter + profile modal
// ─────────────────────────────────────────────────────────────────────────────
function FindStudentsTab() {
  const [students, setStudents]         = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(false)
  const [selected, setSelected]         = useState(new Set())
  const [drives, setDrives]             = useState([])
  const [driveId, setDriveId]           = useState('')
  const [shortlisting, setShortlisting] = useState(false)
  const [result, setResult]             = useState(null)
  const [hasFetched, setHasFetched]     = useState(false)
  const [page, setPage]                 = useState(1)

  // ── NEW: profile modal state ──
  const [profileStudent, setProfileStudent] = useState(null)

  const LIMIT = 15

  const [search,      setSearch]      = useState('')
  const [minCGPA,     setMinCGPA]     = useState('')
  const [maxCGPA,     setMaxCGPA]     = useState('')
  const [branch,      setBranch]      = useState('')
  const [passingYear, setPassingYear] = useState('')
  const [maxBacklogs, setMaxBacklogs] = useState('')
  const [domain,      setDomain]      = useState('')

  useEffect(() => {
    api.get('/jobs', { params: { status: 'active', limit: 50 } })
      .then(r => setDrives(r.data.jobs || []))
      .catch(() => {})
  }, [])

  const doFetch = useCallback(async (pg) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: LIMIT }
      if (search.trim())      params.search      = search.trim()
      if (minCGPA)            params.minCGPA     = minCGPA
      if (maxCGPA)            params.maxCGPA     = maxCGPA
      if (branch.trim())      params.branch      = branch.trim()
      if (passingYear)        params.passingYear = passingYear
      if (maxBacklogs !== '') params.maxBacklogs = maxBacklogs
      if (domain)             params.domain      = domain

      const { data } = await api.get('/students', { params })
      setStudents(data.students || [])
      setTotal(data.total || 0)
      setSelected(new Set())
      setHasFetched(true)
    } catch {
      toast.error('Failed to load students')
    } finally { setLoading(false) }
  }, [search, minCGPA, maxCGPA, branch, passingYear, maxBacklogs, domain])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); doFetch(1) }, 350)
    return () => clearTimeout(t)
  }, [search, minCGPA, maxCGPA, branch, passingYear, maxBacklogs, domain])

  useEffect(() => { if (hasFetched) doFetch(page) }, [page])

  const resetFilters = () => {
    setSearch(''); setMinCGPA(''); setMaxCGPA('')
    setBranch(''); setPassingYear(''); setMaxBacklogs(''); setDomain('')
    setPage(1)
  }

  const hasFilters = search || minCGPA || maxCGPA || branch || passingYear || maxBacklogs !== '' || domain

  const toggleOne = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = () => {
    setSelected(prev => prev.size === students.length ? new Set() : new Set(students.map(s => s._id)))
  }

  const handleShortlist = async () => {
    if (!driveId)            { toast.error('Select a drive first');        return }
    if (selected.size === 0) { toast.error('Select at least one student'); return }
    setShortlisting(true); setResult(null)
    try {
      const { data } = await api.post('/students/shortlist', {
        jobId: driveId, studentIds: [...selected],
      })
      setResult(data); setSelected(new Set())
      toast.success(`${data.shortlisted} student${data.shortlisted !== 1 ? 's' : ''} shortlisted!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shortlisting failed')
    } finally { setShortlisting(false) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">

      {/* ── Student Profile Modal ── */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#1a2744]">Find Students</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Filter by criteria &amp; domain, then shortlist for a drive.{' '}
            <span className="text-blue-500 font-medium">Click any row to view full profile.</span>
          </p>
        </div>
        <Link to="/tpo-dashboard/upload"
          className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl transition-all font-medium shadow-sm">
          <Upload className="w-3.5 h-3.5" />Upload / Update Data
        </Link>
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-[#1a2744]">Filter Criteria</span>
          </div>
          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium">
              <RefreshCw className="w-3 h-3" />Reset
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="text"
            placeholder="Search by name, email or roll number..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a2744] placeholder-slate-400 focus:outline-none focus:border-[#1a2744] focus:bg-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Min CGPA',     val: minCGPA,     set: setMinCGPA,     type: 'number', ph: 'e.g. 7.0', step: '0.1', min: '0', max: '10' },
            { label: 'Max CGPA',     val: maxCGPA,     set: setMaxCGPA,     type: 'number', ph: 'e.g. 10',  step: '0.1', min: '0', max: '10' },
            { label: 'Branch',       val: branch,      set: setBranch,      type: 'text',   ph: 'e.g. CS' },
            { label: 'Passing Year', val: passingYear, set: setPassingYear, type: 'number', ph: 'e.g. 2025' },
            { label: 'Max Backlogs', val: maxBacklogs, set: setMaxBacklogs, type: 'number', ph: 'e.g. 0',   min: '0' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] text-slate-400 mb-1.5 block font-medium uppercase tracking-wide">{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={f.val} step={f.step} min={f.min} max={f.max}
                onChange={e => f.set(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1a2744] placeholder-slate-300 focus:outline-none focus:border-[#1a2744] focus:bg-white transition-colors"
              />
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Specialization Domain</label>
            {domain && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                {domain}
                <button onClick={() => setDomain('')} className="hover:text-emerald-900 ml-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map(d => (
              <button key={d} onClick={() => setDomain(prev => prev === d ? '' : d)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  domain === d
                    ? 'bg-[#1a2744] border-[#1a2744] text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-[#1a2744] hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {hasFetched && !loading && (
          <p className="text-sm text-slate-500 pt-2 border-t border-slate-100">
            Found <span className="font-bold text-emerald-600">{total}</span> student{total !== 1 ? 's' : ''}
            {hasFilters && <span className="text-slate-300 text-xs ml-1">matching your criteria</span>}
          </p>
        )}
      </div>

      {result && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-700">
              {result.shortlisted} student{result.shortlisted !== 1 ? 's' : ''} shortlisted!
            </p>
            {result.alreadyDone > 0 && (
              <p className="text-xs text-slate-400">{result.alreadyDone} were already in pipeline</p>
            )}
          </div>
          <button onClick={() => setResult(null)} className="text-slate-300 hover:text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Student Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <input type="checkbox"
              checked={students.length > 0 && selected.size === students.length}
              onChange={toggleAll}
              className="w-4 h-4 rounded cursor-pointer accent-[#1a2744]"
            />
            <span className="text-xs text-slate-400 font-medium">
              {selected.size > 0
                ? <span className="text-emerald-600 font-semibold">{selected.size} selected</span>
                : 'Select all on this page'}
            </span>
          </div>
          {loading && <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-12 px-5 py-3" />
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide">Student</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide hidden sm:table-cell">Roll No.</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide hidden md:table-cell">Branch</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide">CGPA</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide hidden lg:table-cell">Domain</th>
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide hidden lg:table-cell">Year</th>
              {/* ── NEW column ── */}
              <th className="text-left text-[11px] text-slate-400 px-4 py-3 font-semibold uppercase tracking-wide">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-3">
                  <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                </td></tr>
              ))
            ) : !hasFetched ? (
              <tr><td colSpan={8} className="text-center py-16">
                <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Use the filters above to search for students</p>
                <p className="text-slate-300 text-xs mt-1">Leave all blank to show all students</p>
              </td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16">
                <GraduationCap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No students found</p>
                <p className="text-slate-300 text-xs mt-1">
                  {hasFilters ? 'Try adjusting your filters' : 'Upload student data first'}
                </p>
                {!hasFilters && (
                  <Link to="/tpo-dashboard/upload"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium">
                    <Upload className="w-3.5 h-3.5" />Upload student data →
                  </Link>
                )}
              </td></tr>
            ) : students.map(s => (
              <tr key={s._id}
                className={`transition-colors ${
                  selected.has(s._id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                }`}
              >
                {/* Checkbox — stop row-click from toggling checkbox only */}
                <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleOne(s._id)}
                    className="w-4 h-4 rounded cursor-pointer accent-[#1a2744]" />
                </td>

                {/* Clickable cells → open profile */}
                <td className="px-4 py-3 cursor-pointer" onClick={() => setProfileStudent(s)}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      selected.has(s._id) ? 'bg-[#1a2744] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{s.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a2744] leading-tight">{s.name}</p>
                      <p className="text-[10px] text-slate-400 max-w-[160px] truncate">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell cursor-pointer" onClick={() => setProfileStudent(s)}>
                  <span className="text-xs text-slate-500 font-mono">{s.rollNumber || '—'}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell cursor-pointer" onClick={() => setProfileStudent(s)}>
                  <span className="text-xs text-slate-500">{s.branch || '—'}</span>
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => setProfileStudent(s)}>
                  <span className={`text-sm font-bold ${
                    !s.cgpa       ? 'text-slate-300'    :
                    s.cgpa >= 8.5 ? 'text-emerald-600' :
                    s.cgpa >= 7.5 ? 'text-blue-600'    :
                    s.cgpa >= 6.5 ? 'text-amber-600'   : 'text-red-500'
                  }`}>{s.cgpa ?? '—'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell cursor-pointer" onClick={() => setProfileStudent(s)}>
                  {s.domain ? (
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                      {s.domain}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell cursor-pointer" onClick={() => setProfileStudent(s)}>
                  <span className="text-xs text-slate-500">{s.passingYear || '—'}</span>
                </td>

                {/* ── NEW: explicit View Profile button ── */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => setProfileStudent(s)}
                    className="flex items-center gap-1 text-[11px] text-[#1a2744] font-semibold border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:text-blue-600 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    <Users className="w-3 h-3" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium">{total} total students</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 rounded-lg transition-all font-medium shadow-sm">Prev</button>
              <span className="text-xs text-slate-400 font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="text-xs px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 rounded-lg transition-all font-medium shadow-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky shortlist bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-[#1a2744]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-xl shadow-slate-200">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#1a2744]">
              {selected.size} student{selected.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <select value={driveId} onChange={e => setDriveId(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#1a2744] focus:outline-none focus:border-[#1a2744] transition-colors">
            <option value="">— Select drive to shortlist for —</option>
            {drives.length === 0
              ? <option disabled>No active drives — post one first</option>
              : drives.map(d => (
                  <option key={d._id} value={d._id}>{d.company} — {d.title}</option>
                ))
            }
          </select>
          <button onClick={handleShortlist} disabled={shortlisting || !driveId}
            className="flex items-center justify-center gap-2 bg-[#1a2744] hover:bg-[#243460] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all shrink-0 shadow-sm">
            {shortlisting
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><CheckCircle2 className="w-4 h-4" />Shortlist Now</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function TPODashboard() {
  const location = useLocation()

  const renderTab = () => {
    switch (location.pathname) {
      case '/tpo-dashboard/upload':   return <UploadTab />
      case '/tpo-dashboard/students': return <FindStudentsTab />
      case '/tpo-dashboard/questions': return <CompanyQuestionsPage manageOnly />
      default:                        return <HomeTab />
    }
  }

  return (
    <DashboardLayout>
      <div className={location.pathname === '/tpo-dashboard' ? 'mx-auto w-full max-w-none p-4 sm:p-5 lg:p-6' : 'mx-auto max-w-6xl p-6 lg:p-8'}>
        {renderTab()}
      </div>
    </DashboardLayout>
  )
}
