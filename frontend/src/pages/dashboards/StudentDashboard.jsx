import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, ArrowRight, Award, Bell, BookOpen, Briefcase,
  CalendarDays, CheckCircle2, ChevronRight, CircleUserRound, Clock3,
  FileText, GraduationCap, MapPin, Pencil, Phone, Search, ShieldCheck,
  Sparkles, Upload, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import CompanyLogo from '../../components/ui/CompanyLogo'

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
const FILE_ORIGIN = API_ORIGIN || (import.meta.env.DEV ? 'http://localhost:5000' : '')

const getFileUrl = file => {
  if (!file) return ''
  if (/^https?:\/\//i.test(file)) return file
  return `${FILE_ORIGIN}${file.startsWith('/') ? '' : '/'}${file}`
}

const formatDate = date => {
  if (!date) return '—'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatDateInput = date => {
  if (!date) return ''
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

const STATUS = {
  applied: { label: 'Applied', style: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  shortlisted: { label: 'Shortlisted', style: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  interview: { label: 'Interview', style: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  selected: { label: 'Selected', style: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Not selected', style: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  withdrawn: { label: 'Withdrawn', style: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

const getProfileCompletion = user => {
  const fields = [
    ['name', 'Full name'],
    ['email', 'Email address'],
    ['phone', 'Phone number'],
    ['branch', 'Branch'],
    ['passingYear', 'Graduation year'],
    ['cgpa', 'CGPA'],
    ['prn', 'PRN'],
    ['photo', 'Profile photo'],
    ['resume', 'Resume'],
  ]
  const completed = fields.filter(([key]) => user?.[key] !== undefined && user?.[key] !== null && String(user[key]).trim() !== '')
  return {
    percent: Math.round((completed.length / fields.length) * 100),
    missing: fields.filter(([key]) => user?.[key] === undefined || user?.[key] === null || String(user[key]).trim() === '').map(([, label]) => label),
  }
}

function SectionHeading({ icon: Icon, title, detail, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || 'Not added yet'}</p>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user, updateUser } = useAuth()
  const [jobs, setJobs] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewingResume, setPreviewingResume] = useState(false)
  const [profile, setProfile] = useState({
    prn: '', dob: '', address: '', photo: null, resume: null,
  })
  const [photoPreview, setPhotoPreview] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const results = await Promise.allSettled([
      api.get('/jobs', { params: { status: 'active', limit: 8 } }),
      api.get('/applications/my'),
    ])

    if (results[0].status === 'fulfilled') {
      setJobs(results[0].value.data.jobs || [])
    } else {
      toast.error('Could not load current placement drives.')
    }
    if (results[1].status === 'fulfilled') {
      setApps(results[1].value.data.applications || [])
    } else {
      toast.error('Could not load your applications.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    setProfile({
      prn: user?.prn || '',
      dob: formatDateInput(user?.dob),
      address: user?.address || '',
      photo: null,
      resume: null,
    })
    setPhotoPreview(getFileUrl(user?.photo))
  }, [user])

  useEffect(() => () => {
    if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const counts = useMemo(() => apps.reduce((result, application) => {
    result[application.status] = (result[application.status] || 0) + 1
    return result
  }, {}), [apps])

  const { percent, missing } = getProfileCompletion(user)
  const searchedJobs = jobs.filter(job => (
    `${job.title} ${job.company} ${job.location || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  ))
  const recentApplications = [...apps]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5)

  const handleProfileChange = event => {
    const { name, value } = event.target
    setProfile(current => ({ ...current, [name]: value }))
  }

  const handleFileChange = event => {
    const { name, files } = event.target
    const file = files?.[0]
    if (!file) return

    if (name === 'photo') {
      if (!file.type.startsWith('image/')) {
        toast.error('Choose an image file for your profile photo.')
        event.target.value = ''
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Profile photo must be smaller than 2 MB.')
        event.target.value = ''
        return
      }
      setPhotoPreview(URL.createObjectURL(file))
    }
    if (name === 'resume' && (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024)) {
      toast.error('Choose a PDF resume smaller than 5 MB.')
      event.target.value = ''
      return
    }
    setProfile(current => ({ ...current, [name]: file }))
  }

  const saveProfile = async event => {
    event.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('prn', profile.prn)
      formData.append('dob', profile.dob)
      formData.append('address', profile.address)
      if (profile.photo) formData.append('photo', profile.photo)
      if (profile.resume) formData.append('resume', profile.resume)

      const { data } = await api.put('/users/profile', formData)
      updateUser(data.user)
      setShowEdit(false)
      toast.success('Your profile has been updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  const previewResume = async () => {
    const previewTab = window.open('', '_blank')
    if (!previewTab) {
      toast.error('Allow pop-ups to preview your resume.')
      return
    }
    previewTab.opener = null
    setPreviewingResume(true)

    try {
      const { data } = await api.get('/users/profile/resume/preview', { responseType: 'blob' })
      const pdf = new Blob([data], { type: 'application/pdf' })
      const previewUrl = URL.createObjectURL(pdf)
      previewTab.location.replace(previewUrl)
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 120000)
    } catch {
      previewTab.close()
      toast.error('Could not open your resume. Please try again.')
    } finally {
      setPreviewingResume(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f6f8fc]">
        <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:z-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <form
              className="relative w-full max-w-md"
              onSubmit={event => event.preventDefault()}
              role="search"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search open placement drives..."
                aria-label="Search placement drives"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </form>
            <div className="flex shrink-0 items-center gap-3">
              <Link to="/notifications" aria-label="Open notifications" title="Notifications" className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                <Bell className="h-5 w-5" />
              </Link>
              <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {user?.photo
                    ? <img src={getFileUrl(user.photo)} alt="" className="h-full w-full object-cover" />
                    : user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="max-w-36">
                  <p className="truncate text-xs font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">Student</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:space-y-7 lg:py-8">
          <section className="relative isolate overflow-hidden rounded-3xl border border-blue-100/90 bg-gradient-to-br from-white via-[#f0f6ff] to-[#e8efff] px-5 py-6 shadow-sm sm:px-7 sm:py-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full border-[38px] border-white/60" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-1/4 -z-10 h-44 w-44 rounded-full bg-blue-100/40 blur-2xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" /> Student placement hub
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome back, {user?.name?.trim().split(/\s+/)[0] || 'student'} <span aria-hidden="true">👋</span>
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  Your next opportunity starts with staying prepared. Check your progress, explore open drives, and keep moving forward.
                </p>
              </div>
              <Link to="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                Explore drives <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]" aria-label="Student overview">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-bold text-blue-700 ring-4 ring-blue-50">
                    {photoPreview
                      ? <img src={photoPreview} alt={`${user?.name || 'Student'} profile`} className="h-full w-full object-cover" />
                      : user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-bold text-slate-900">{user?.name}</h2>
                      {user?.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{user?.branch || 'Branch not added'}{user?.passingYear ? ` · ${user.passingYear} batch` : ''}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <div className="w-full border-t border-slate-100 pt-4 md:w-[42%] md:border-l md:border-t-0 md:pl-5 md:pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">Profile strength</span>
                    <span className="font-bold text-blue-700">{percent}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700" style={{ width: `${percent}%` }} />
                  </div>
                  <button type="button" onClick={() => setShowEdit(true)} className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2 text-left text-xs font-medium text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                    <span className="line-clamp-2">{missing.length ? `Complete your profile: ${missing.slice(0, 2).join(', ')}` : 'Your profile is ready for recruiters'}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </button>
                </div>
                <button type="button" onClick={() => setShowEdit(current => !current)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                  {showEdit ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  {showEdit ? 'Close editor' : 'Edit profile'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Applications', value: apps.length, icon: FileText, theme: 'blue', to: '/applications' },
                { label: 'Shortlisted', value: counts.shortlisted || 0, icon: CheckCircle2, theme: 'emerald', to: '/applications' },
                { label: 'Interviews', value: counts.interview || 0, icon: CalendarDays, theme: 'violet', to: '/applications' },
                { label: 'Selected', value: counts.selected || 0, icon: Award, theme: 'amber', to: '/applications' },
              ].map(stat => (
                <Link key={stat.label} to={stat.to} className={`group flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:p-4 ${
                  stat.theme === 'blue' ? 'border-blue-100 bg-blue-50/80' :
                  stat.theme === 'emerald' ? 'border-emerald-100 bg-emerald-50/80' :
                  stat.theme === 'violet' ? 'border-violet-100 bg-violet-50/80' :
                  'border-amber-100 bg-amber-50/80'
                }`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                    <stat.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs text-slate-600">{stat.label}</span>
                    <span className="mt-0.5 block text-2xl font-bold leading-none text-slate-900">{loading ? '—' : stat.value}</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>

          {showEdit && (
            <form onSubmit={saveProfile} className="scroll-mt-24 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Update your profile</h2>
                  <p className="mt-1 text-sm text-slate-500">Your saved details help recruiters understand your profile.</p>
                </div>
                <button type="button" onClick={() => setShowEdit(false)} aria-label="Close profile editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  PRN
                  <input name="prn" value={profile.prn} onChange={handleProfileChange} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="Enter your PRN" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Date of birth
                  <input type="date" name="dob" value={profile.dob} onChange={handleProfileChange} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Address
                  <textarea name="address" value={profile.address} onChange={handleProfileChange} rows="2" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="City, state" />
                </label>
                <label className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50">
                  <span className="flex items-center gap-2"><CircleUserRound className="h-4 w-4 text-blue-600" /> Profile photo <span className="text-xs font-normal text-slate-500">(max 2 MB)</span></span>
                  <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                </label>
                <label className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50">
                  <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-blue-600" /> Resume <span className="text-xs font-normal text-slate-500">(PDF, max 5 MB)</span></span>
                  <input type="file" name="resume" accept="application/pdf,.pdf" onChange={handleFileChange} className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                </label>
              </div>
              <div className="mt-5 flex justify-end">
                <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {saving ? 'Saving profile…' : 'Save profile'}
                </button>
              </div>
            </form>
          )}

          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={CircleUserRound}
                title="Personal & academic information"
                detail="Your information shown to placement teams"
                action={<button type="button" onClick={() => setShowEdit(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"><Pencil className="h-3.5 w-3.5" /> Edit</button>}
              />
              <div className="grid gap-x-6 gap-y-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <InfoItem icon={CircleUserRound} label="Email" value={user?.email} />
                <InfoItem icon={Phone} label="Phone" value={user?.phone} />
                <InfoItem icon={GraduationCap} label="Branch" value={user?.branch} />
                <InfoItem icon={CalendarDays} label="Graduation year" value={user?.passingYear} />
                <InfoItem icon={Award} label="CGPA" value={user?.cgpa} />
                <InfoItem icon={BookOpen} label="PRN" value={user?.prn} />
                <InfoItem icon={MapPin} label="Address" value={user?.address} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading icon={FileText} title="Resume" detail="Your latest uploaded document" />
              {user?.resume ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><FileText className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">Resume on your profile</p>
                      <p className="mt-1 text-xs text-slate-500">Available when you apply to placement drives</p>
                    </div>
                    <button type="button" onClick={previewResume} disabled={previewingResume} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                      {previewingResume ? 'Opening…' : 'Preview'}
                    </button>
                  </div>
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Resume is uploaded and ready to use.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-5 text-center">
                  <FileText className="mx-auto h-8 w-8 text-blue-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">Add your resume to apply faster</p>
                  <p className="mt-1 text-xs text-slate-500">Upload a PDF from the profile editor. Max size 5 MB.</p>
                  <button type="button" onClick={() => setShowEdit(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Upload className="h-3.5 w-3.5" /> Upload resume</button>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Placement readiness</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{percent >= 80 ? 'Looking strong' : 'Keep building'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Profile updated</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(user?.updatedAt || user?.createdAt)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]" aria-label="Profile and resume">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={Briefcase}
                title="Open placement drives"
                detail={search ? `Showing matches for “${search}”` : 'Active opportunities currently open'}
                action={<Link to="/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800">Browse all <ArrowRight className="h-3.5 w-3.5" /></Link>}
              />
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
              ) : searchedJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                  <Search className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">{search ? 'No matching active drives' : 'No active drives right now'}</p>
                  <p className="mt-1 text-xs text-slate-500">{search ? 'Try another search term.' : 'Check back soon for new opportunities.'}</p>
                  {search && <button type="button" onClick={() => setSearch('')} className="mt-3 text-xs font-semibold text-blue-700">Clear search</button>}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchedJobs.slice(0, 4).map(job => (
                    <Link key={job._id} to={`/jobs/${job._id}`} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                      <CompanyLogo
                        src={job.logo}
                        company={job.company}
                        className="h-11 w-11 rounded-xl border border-slate-100 bg-slate-100 text-sm font-bold text-slate-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{job.company} · {job.location || 'On-campus'}</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs font-medium text-slate-700">{job.package || job.stipend || 'Placement drive'}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{job.lastDateToApply ? `Apply by ${formatDate(job.lastDateToApply)}` : 'Applications open'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading icon={Activity} title="Recent application activity" detail="Your latest placement updates" />
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
                ) : recentApplications.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-7 text-center">
                    <Briefcase className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Your journey starts here</p>
                    <p className="mt-1 text-xs text-slate-500">Apply to an active drive to see updates here.</p>
                    <Link to="/jobs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">Find a drive <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentApplications.map(application => {
                      const status = STATUS[application.status] || STATUS.applied
                      return (
                        <div key={application._id} className="flex items-start gap-3 border-l-2 border-slate-100 py-2 pl-3">
                          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{application.job?.company || 'Placement drive'}</p>
                            <p className="truncate text-xs text-slate-500">{application.job?.title || 'Application update'}</p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="h-3 w-3" /> {formatDate(application.updatedAt || application.createdAt)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${status.style}`}>{status.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {recentApplications.length > 0 && (
                  <Link to="/applications" className="mt-3 flex items-center justify-center gap-1 border-t border-slate-100 pt-3 text-xs font-semibold text-blue-700 hover:text-blue-800">View all applications <ArrowRight className="h-3.5 w-3.5" /></Link>
                )}
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-5 shadow-sm sm:p-6">
                <SectionHeading icon={Sparkles} title="Your next steps" detail="Small steps build placement confidence" />
                <div className="space-y-2.5">
                  {[
                    { title: 'Complete your profile', description: `${percent}% complete${missing.length ? ` · ${missing[0]} missing` : ' · all set'}`, done: percent === 100, action: () => setShowEdit(true), label: percent === 100 ? 'Review' : 'Complete' },
                    { title: 'Prepare for interviews', description: 'Build confidence before your next drive', to: '/prepare', label: 'Get ready' },
                    { title: 'Practise company questions', description: 'Review previous-year interview questions', to: '/previous-year-questions', label: 'Practise' },
                  ].map(step => (
                    <div key={step.title} className="flex items-center gap-3 rounded-xl border border-white bg-white/80 p-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${step.done ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-700'}`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800">{step.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{step.description}</p>
                      </div>
                      {step.to ? (
                        <Link to={step.to} className="shrink-0 text-[11px] font-semibold text-blue-700 hover:text-blue-900">{step.label}</Link>
                      ) : (
                        <button type="button" onClick={step.action} className="shrink-0 text-[11px] font-semibold text-blue-700 hover:text-blue-900">{step.label}</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> PlaceNext · Your career, your next step.</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Updated {formatDate(new Date())}</span>
          </footer>
        </main>
      </div>
    </DashboardLayout>
  )
}
