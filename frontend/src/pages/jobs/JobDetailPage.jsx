import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Briefcase, MapPin, Star, Calendar, Users, ChevronLeft,
  CheckCircle2, XCircle, AlertCircle, Clock, Building2,
  GraduationCap, Zap, Hash, BookOpen, FileText, Send,
  Upload, X, CheckCircle, IndianRupee, Globe, Phone,
  Mail, Share2, Bookmark, BookmarkCheck, ChevronRight,
  Shield, Award, TrendingUp, Eye, Download, RefreshCw,
  UserCheck, AlertTriangle, Ban,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import toast from 'react-hot-toast'
import { getDaysUntilDeadline, isDeadlinePassed } from '../../utils/jobDeadline'
import CompanyLogo from '../../components/ui/CompanyLogo'

// ─── Eligibility checker ──────────────────────────────────────────────────────
function checkEligibility(user, job) {
  const reasons = []
  const el = job.eligibility || {}
  if (el.minCGPA > 0)             reasons.push({ field: 'CGPA',         required: `≥ ${el.minCGPA}`,          yours: user.cgpa || 'Not set',       pass: (user.cgpa || 0) >= el.minCGPA })
  if (el.branches?.length > 0)    reasons.push({ field: 'Branch',       required: el.branches.join(', '),     yours: user.branch || 'Not set',      pass: el.branches.includes(user.branch) })
  if (el.passingYear?.length > 0) reasons.push({ field: 'Passing Year', required: el.passingYear.join(', '), yours: user.passingYear || 'Not set',  pass: el.passingYear.includes(Number(user.passingYear)) })
  return { eligible: reasons.every(r => r.pass), reasons }
}

// ─── Profile completeness check ───────────────────────────────────────────────
function checkProfile(user) {
  const checks = [
    { field: 'Name',         done: !!user?.name },
    { field: 'Phone',        done: !!user?.phone },
    { field: 'CGPA',         done: !!user?.cgpa },
    { field: 'Branch',       done: !!user?.branch },
    { field: 'Passing Year', done: !!user?.passingYear },
    { field: 'Resume',       done: !!(user?.resumeUrl || user?.resume) },
  ]
  const missing = checks.filter(c => !c.done).map(c => c.field)
  return { complete: missing.length === 0, missing, checks }
}

// ─── Resolve resume URL ───────────────────────────────────────────────────────
function resolveResumeUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ job, user, onClose, onSuccess }) {
  const fileRef = useRef()

  const rawResumeUrl      = user?.resumeUrl || user?.resume
  const hasProfileResume  = !!rawResumeUrl
  const resolvedResumeUrl = resolveResumeUrl(rawResumeUrl)

  const [useProfileResume, setUseProfileResume] = useState(hasProfileResume)
  const [newResumeFile, setNewResumeFile]       = useState(null)
  const [showChangeResume, setShowChangeResume] = useState(false)
  const [dragging, setDragging]                 = useState(false)
  const [coverLetter, setCoverLetter]           = useState('')
  const [submitting, setSubmitting]             = useState(false)

  const { complete: profileComplete, missing } = checkProfile(user)
  const canSubmit = useProfileResume ? hasProfileResume : !!newResumeFile

  const handleFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext)) return toast.error('Only PDF, DOC, DOCX allowed')
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB')
    setNewResumeFile(file)
    setUseProfileResume(false)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return toast.error('Please attach a resume before submitting.')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('jobId', job._id)
      fd.append('coverLetter', coverLetter)
      if (!useProfileResume && newResumeFile) fd.append('resume', newResumeFile)
      await api.post('/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onSuccess()
      toast.success('🎉 Application submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Apply for {job.title}</h2>
            <p className="text-gray-400 text-sm">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Profile info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-green-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Profile</p>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold ml-auto">
                Auto-filled from profile
              </span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: 'Phone',  value: user?.phone },
                  { label: 'CGPA',   value: user?.cgpa },
                  { label: 'Branch', value: user?.branch },
                  { label: 'Year',   value: user?.passingYear },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-1.5">
                    <span className="text-[11px] text-gray-400">{f.label}</span>
                    <span className={`text-xs font-semibold ${f.value ? 'text-gray-800' : 'text-red-400'}`}>
                      {f.value || 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
              {!profileComplete && (
                <div className="flex items-start gap-2 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">Incomplete profile:</span> {missing.join(', ')} missing.{' '}
                    <Link to="/profile" className="underline font-semibold">Update profile →</Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resume section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resume</p>
            </div>

            {hasProfileResume && !showChangeResume && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Profile resume attached</p>
                  <p className="text-xs text-green-600">Your resume from profile will be sent automatically</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={resolvedResumeUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 font-semibold hover:text-blue-700">
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <button
                    onClick={() => { setShowChangeResume(true); setUseProfileResume(false) }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium">
                    <RefreshCw className="w-3 h-3" /> Change
                  </button>
                </div>
              </div>
            )}

            {!hasProfileResume && !showChangeResume && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">No resume in your profile</p>
                  <p className="text-xs text-red-500 mb-2">You need to attach a resume to apply.</p>
                  <button onClick={() => setShowChangeResume(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline">
                    Upload resume for this application →
                  </button>
                </div>
              </div>
            )}

            {showChangeResume && (
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-200">
                  <p className="text-xs font-bold text-blue-700">Upload a different resume</p>
                  {hasProfileResume && (
                    <button
                      onClick={() => { setShowChangeResume(false); setUseProfileResume(true); setNewResumeFile(null) }}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Use profile resume instead
                    </button>
                  )}
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                  onClick={() => fileRef.current?.click()}
                  className={`p-6 text-center cursor-pointer transition ${dragging ? 'bg-blue-50' : newResumeFile ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
                    onChange={e => handleFile(e.target.files[0])} />
                  {newResumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-green-500" />
                      <div className="text-left">
                        <p className="font-semibold text-green-700 text-sm">{newResumeFile.name}</p>
                        <p className="text-xs text-green-500">{(newResumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setNewResumeFile(null) }}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-7 h-7 mx-auto mb-2 ${dragging ? 'text-blue-500' : 'text-gray-300'}`} />
                      <p className="text-sm font-medium text-gray-600 mb-1">Drag & drop or click to upload</p>
                      <p className="text-xs text-gray-400">PDF, DOC, DOCX · Max 5MB</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cover letter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Cover Letter <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <textarea rows={3} value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
              placeholder="Tell the recruiter why you're a great fit for this role..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none" />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting || !canSubmit}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              : <><Send className="w-4 h-4" /> Submit Application</>
            }
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-red-400 -mt-2">Please upload a resume to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Job Detail Page ─────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [job, setJob]                             = useState(null)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [applicantCount, setApplicantCount]       = useState(0)
  const [loading, setLoading]                     = useState(true)
  const [showApply, setShowApply]                 = useState(false)
  const [saved, setSaved]                         = useState(false)

  const isStudent    = user?.role === 'student'
  const isManagement = ['tpo', 'recruiter', 'admin'].includes(user?.role)

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => {
        setJob(data.job)
        setApplicationStatus(data.applicationStatus)
        setApplicantCount(data.applicantCount)
      })
      .catch(() => toast.error('Failed to load job'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </DashboardLayout>
  )

  if (!job) return (
    <DashboardLayout>
      <div className="p-8 text-center text-gray-400">
        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Job not found.</p>
      </div>
    </DashboardLayout>
  )

  const { eligible, reasons }                         = isStudent ? checkEligibility(user, job) : { eligible: true, reasons: [] }
  const { complete: profileComplete, missing: missingFields } = isStudent ? checkProfile(user)  : { complete: true, missing: [] }

  const deadline       = job.lastDateToApply ? new Date(job.lastDateToApply) : null
  const daysLeft       = getDaysUntilDeadline(job.lastDateToApply)
  const deadlinePassed = isDeadlinePassed(job.lastDateToApply)
  const jobClosed      = job.status !== 'open' && job.status !== 'active'

  // Student cannot apply if: deadline passed OR job closed
  const cannotApply = deadlinePassed || jobClosed

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => navigate(-1)} className="hover:text-gray-600 flex items-center gap-1 transition">
              <ChevronLeft className="w-4 h-4" /> Jobs
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium truncate">{job.title}</span>
          </div>

          {/* ── Deadline passed banner ── */}
          {isStudent && !applicationStatus && deadlinePassed && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-700 text-sm">Application deadline has passed</p>
                <p className="text-xs text-red-500 mt-0.5">
                  The last date to apply was{' '}
                  <span className="font-semibold">
                    {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>. This drive is no longer accepting applications.
                </p>
              </div>
            </div>
          )}

          {/* ── Job closed banner ── */}
          {isStudent && !applicationStatus && jobClosed && !deadlinePassed && (
            <div className="bg-gray-100 border border-gray-300 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Ban className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <p className="text-sm text-gray-600 font-medium">
                This job posting is <span className="font-bold">closed</span> and no longer accepting new applications.
              </p>
            </div>
          )}

          {/* ── Profile incomplete banner ── */}
          {isStudent && !profileComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 flex-1">
                <span className="font-bold">Your profile is incomplete.</span>{' '}
                {missingFields.join(', ')} {missingFields.length === 1 ? 'is' : 'are'} missing — recruiters may not consider incomplete profiles.
              </p>
              <Link to="/profile"
                className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition flex-shrink-0">
                Complete Profile →
              </Link>
            </div>
          )}

          {/* ── Hero Card ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />
            <div className="p-6">
              <div className="flex flex-wrap gap-4 justify-between">

                {/* Left */}
                <div className="flex gap-4">
                  <CompanyLogo
                    src={job.logo}
                    company={job.company}
                    className="h-16 w-16 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-100 to-blue-200 text-2xl font-bold text-blue-700 shadow-sm"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                    <p className="text-blue-600 font-semibold mt-0.5">{job.company}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        job.location && { icon: MapPin,      text: job.location,                   color: 'text-gray-600 bg-gray-100'    },
                        job.type     && { icon: Briefcase,   text: job.type,                       color: 'text-blue-700 bg-blue-50'     },
                        (job.package || job.stipend) && { icon: IndianRupee, text: job.package || job.stipend, color: 'text-green-700 bg-green-50' },
                        job.openings && { icon: Users,       text: `${job.openings} openings`,     color: 'text-violet-700 bg-violet-50' },
                      ].filter(Boolean).map((pill, i) => (
                        <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${pill.color}`}>
                          <pill.icon className="w-3.5 h-3.5" />{pill.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    deadlinePassed || jobClosed
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {deadlinePassed ? '🔴 Deadline Passed' : jobClosed ? '🔴 Closed' : '🟢 Actively Hiring'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSaved(p => !p); toast.success(saved ? 'Job unsaved' : 'Job saved!') }}
                      className={`p-2.5 rounded-xl border transition ${saved ? 'bg-blue-50 border-blue-200 text-blue-500' : 'border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-400'}`}>
                      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-400 transition">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  {isManagement && (
                    <Link to={`/jobs/${id}/applicants`} className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700">
                      <Users className="w-4 h-4" />{applicantCount} Applicants
                    </Link>
                  )}
                </div>
              </div>

              {/* ── Apply / Status bar ── */}
              {isStudent && (
                <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-4">

                  {/* Already applied — show status */}
                  {applicationStatus ? (
                    <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border font-semibold text-sm ${
                      applicationStatus === 'selected'  ? 'bg-green-50  border-green-200  text-green-700'  :
                      applicationStatus === 'rejected'  ? 'bg-red-50    border-red-200    text-red-600'    :
                      applicationStatus === 'interview' ? 'bg-violet-50 border-violet-200 text-violet-600' :
                      'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      Application Status: <span className="capitalize ml-1">{applicationStatus}</span>
                    </div>

                  ) : cannotApply ? (
                    /* Deadline passed or job closed — show disabled state, NO apply button */
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border bg-gray-100 border-gray-200 text-gray-400 font-semibold text-sm cursor-not-allowed select-none">
                      <Ban className="w-4 h-4" />
                      {deadlinePassed ? 'Application Deadline Passed' : 'Job Closed'}
                    </div>

                  ) : (
                    /* Active — show apply button */
                    <>
                      <button
                        onClick={() => eligible ? setShowApply(true) : toast.error('You are not eligible for this job')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition shadow-lg ${
                          eligible
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}>
                        <Send className="w-4 h-4" />
                        {eligible ? 'Apply Now' : 'Not Eligible'}
                      </button>

                      {/* Resume status pill */}
                      {eligible && (
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                          (user?.resumeUrl || user?.resume)
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                        }`}>
                          {(user?.resumeUrl || user?.resume)
                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Resume ready</>
                            : <><AlertCircle  className="w-3.5 h-3.5" /> No resume in profile</>
                          }
                        </span>
                      )}

                      {/* Days left */}
                      {daysLeft !== null && (
                        <span className={`text-sm font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                          ⏰ {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to apply
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Eligibility Banner ── */}
          {isStudent && !eligible && reasons.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="font-semibold text-red-700">You don't meet the eligibility criteria</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {reasons.map(r => (
                  <div key={r.field} className={`p-3 rounded-xl border ${r.pass ? 'bg-green-50 border-green-200' : 'bg-white border-red-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-600 uppercase">{r.field}</span>
                      {r.pass ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{r.yours}</p>
                    <p className="text-xs text-gray-400">Required: {r.required}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Main 2-col layout ── */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-4">

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" /> Job Description
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>

              {job.skills?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(s => (
                      <span key={s} className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-700 font-medium hover:bg-blue-100 transition">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(job.eligibility?.minCGPA || job.eligibility?.branches?.length > 0) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" /> Eligibility Criteria
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {job.eligibility?.minCGPA > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Minimum CGPA</p>
                          <p className="font-bold text-gray-800">{job.eligibility.minCGPA}</p>
                        </div>
                      </div>
                    )}
                    {job.eligibility?.branches?.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <GraduationCap className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Eligible Branches</p>
                          <p className="font-bold text-gray-800 text-sm">{job.eligibility.branches.join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {job.eligibility?.passingYear?.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Calendar className="w-5 h-5 text-violet-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Passing Year</p>
                          <p className="font-bold text-gray-800">{job.eligibility.passingYear.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Apply button — hidden if deadline passed or job closed */}
              {isStudent && !applicationStatus && !cannotApply && (
                <button
                  onClick={() => eligible ? setShowApply(true) : toast.error('You are not eligible for this job')}
                  className={`w-full py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2 ${
                    eligible
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                  <Send className="w-5 h-5" />
                  {eligible ? 'Apply Now' : 'Not Eligible to Apply'}
                </button>
              )}

              {/* Bottom expired notice */}
              {isStudent && !applicationStatus && cannotApply && (
                <div className="w-full py-4 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 text-gray-400 font-semibold text-base">
                  <Ban className="w-5 h-5" />
                  {deadlinePassed ? 'Application Deadline Has Passed' : 'This Job Is Closed'}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Job Overview</h3>
                <div className="space-y-3">
                  {[
                    { icon: Clock,      label: 'Apply Before', value: deadline?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Open' },
                    { icon: Calendar,   label: 'Drive Date',   value: job.driveDate ? new Date(job.driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                    { icon: Users,      label: 'Openings',     value: job.openings || 'Multiple' },
                    { icon: Briefcase,  label: 'Job Type',     value: job.type || 'Full Time' },
                    { icon: MapPin,     label: 'Location',     value: job.location || '—' },
                    { icon: TrendingUp, label: 'Experience',   value: job.experience || 'Fresher' },
                  ].map(item => item.value && (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className={`text-sm font-semibold ${item.label === 'Apply Before' && deadlinePassed ? 'text-red-500' : 'text-gray-800'}`}>
                          {item.value}
                          {item.label === 'Apply Before' && deadlinePassed && ' (Expired)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {job.postedBy && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Posted By</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {job.postedBy.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{job.postedBy.name}</p>
                      <p className="text-xs text-gray-400">{job.postedBy.companyName || job.postedBy.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {isManagement && (
                <Link to={`/jobs/${id}/applicants`}
                  className="flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition">
                  <div>
                    <p className="font-bold text-lg">{applicantCount}</p>
                    <p className="text-blue-200 text-sm">Total Applicants</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showApply && (
        <ApplyModal
          job={job}
          user={user}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setApplicationStatus('applied')
            setApplicantCount(c => c + 1)
            setShowApply(false)
          }}
        />
      )}
    </DashboardLayout>
  )
}