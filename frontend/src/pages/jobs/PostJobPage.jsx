import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  Briefcase, Plus, X, ChevronLeft, ImagePlus, Building2
} from 'lucide-react'
import api from '../../api'

const BRANCHES = [
  'Computer Engineering',
  'Computer Science',
  'AIML',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical'
]

const ROUNDS = [
  'Aptitude Test',
  'Technical Round',
  'HR Interview',
  'Group Discussion',
  'Coding Test',
  'Case Study'
]

const YEARS = ['2025', '2026', '2027', '2028']

export default function PostJobPage() {

  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState([])
  const [selectedRounds, setSelectedRounds] = useState([])
  const [selectedYears, setSelectedYears] = useState([])
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [companyLogo, setCompanyLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => () => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      type: 'full-time',
      status: 'active',
      openings: 1,
      minCGPA: '',
      maxBacklogs: 0,
    }
  })

  const toggleBranch = (b) =>
    setSelectedBranches(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    )

  const toggleRound = (r) =>
    setSelectedRounds(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    )

  const toggleYear = (y) =>
    setSelectedYears(prev =>
      prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y]
    )

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleLogoChange = event => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, or WEBP company logo.')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Company logo must be smaller than 2 MB.')
      event.target.value = ''
      return
    }

    setCompanyLogo(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        eligibility: {
          branches: selectedBranches,
          minCGPA: Number(data.minCGPA) || 0,
          passingYear: selectedYears,
          backlogs: Number(data.maxBacklogs) || 0,
        },
        rounds: selectedRounds,
        skills,
      }
      delete payload.minCGPA
      delete payload.maxBacklogs

      if (companyLogo) {
        const formData = new FormData()
        formData.append('job', JSON.stringify(payload))
        formData.append('logo', companyLogo)
        await api.post('/jobs', formData)
      } else {
        await api.post('/jobs', payload)
      }
      toast.success('Drive posted successfully!')
      navigate('/jobs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls = "w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#1a2744] placeholder-slate-400 focus:outline-none focus:border-[#1a2744] focus:bg-white transition-colors"
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wide"

  return (
    <div className="min-h-screen bg-slate-50 pb-16">

      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#1a2744] hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1a2744]">Post Placement Drive</h1>
            <p className="text-sm text-slate-400">Add new campus recruitment drive</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* BASIC INFO */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Job Title *</label>
              <input
                type="text"
                placeholder="Software Engineer"
                className={inputCls}
                {...register('title', { required: true })}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">Job title is required</p>}
            </div>
            <div>
              <label className={labelCls}>Company Name *</label>
              <input
                type="text"
                placeholder="Google / TCS / Infosys"
                className={inputCls}
                {...register('company', { required: true })}
              />
              {errors.company && <p className="text-xs text-red-500 mt-1">Company name is required</p>}
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="company-logo">Company Logo</label>
            <p className="mt-1 text-xs text-slate-400">Optional · JPG, PNG, or WEBP · up to 2 MB</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                {logoPreview
                  ? <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-contain" />
                  : <Building2 className="h-7 w-7" />}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="company-logo" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                  <ImagePlus className="h-4 w-4 text-blue-600" />
                  {companyLogo ? 'Change logo' : 'Upload logo'}
                  <input
                    id="company-logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </label>
                {companyLogo && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyLogo(null)
                      setLogoPreview('')
                    }}
                    className="text-xs font-semibold text-slate-500 transition hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Job Description *</label>
            <textarea
              rows={4}
              placeholder="Describe the role, responsibilities, and requirements..."
              className={inputCls}
              {...register('description', { required: true })}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">Description is required</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Job Type</label>
              <select className={inputCls} {...register('type')}>
                <option value="full-time">Full Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input
                type="text"
                placeholder="Pune / Bangalore / Remote"
                className={inputCls}
                {...register('location')}
              />
            </div>
            <div>
              <label className={labelCls}>Openings</label>
              <input
                type="number"
                min="1"
                className={inputCls}
                {...register('openings')}
              />
            </div>
          </div>
        </section>

        {/* DATES */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Important Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Drive Date</label>
              <input type="date" className={inputCls} {...register('driveDate')} />
            </div>
            <div>
              <label className={labelCls}>Last Date to Apply</label>
              <input type="date" className={inputCls} {...register('lastDateToApply')} />
            </div>
          </div>
        </section>

        {/* ELIGIBILITY */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eligibility Criteria</h2>

          {/* Branches */}
          <div>
            <label className={labelCls}>Eligible Branches</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBranch(b)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    selectedBranches.includes(b)
                      ? 'bg-[#1a2744] border-[#1a2744] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-[#1a2744]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Passing Year */}
          <div>
            <label className={labelCls}>Passing Year</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {YEARS.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => toggleYear(y)}
                  className={`text-xs px-4 py-1.5 rounded-full border font-medium transition-all ${
                    selectedYears.includes(y)
                      ? 'bg-[#1a2744] border-[#1a2744] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-[#1a2744]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* CGPA & Backlogs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Min CGPA */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className={labelCls}>Minimum CGPA Required</label>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Students below this CGPA won't be eligible</p>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="e.g. 6.5"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#1a2744] placeholder-slate-400 focus:outline-none focus:border-[#1a2744] transition-colors font-semibold"
                {...register('minCGPA')}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
                <span>0.0</span>
                <span>Scale: 0 – 10</span>
                <span>10.0</span>
              </div>
            </div>

            {/* Max Backlogs */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className={labelCls}>Maximum Backlogs Allowed</label>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Set 0 to allow only students with no backlogs</p>
              <input
                type="number"
                min="0"
                placeholder="e.g. 0"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#1a2744] placeholder-slate-400 focus:outline-none focus:border-[#1a2744] transition-colors font-semibold"
                {...register('maxBacklogs')}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
                <span>0 = No backlogs</span>
                <span>Enter max allowed</span>
              </div>
            </div>
          </div>

          {/* Salary / Package */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>CTC / Stipend</label>
              <input
                type="text"
                placeholder="e.g. 6 LPA / ₹25,000/month"
                className={inputCls}
                {...register('salary')}
              />
            </div>
            <div>
              <label className={labelCls}>Bond / Service Agreement</label>
              <input
                type="text"
                placeholder="e.g. 1 year bond / No bond"
                className={inputCls}
                {...register('bond')}
              />
            </div>
          </div>
        </section>

        {/* INTERVIEW ROUNDS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interview Rounds</h2>
          <div className="flex flex-wrap gap-2">
            {ROUNDS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => toggleRound(r)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  selectedRounds.includes(r)
                    ? 'bg-[#1a2744] border-[#1a2744] text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-[#1a2744]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {selectedRounds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedRounds.map((r, i) => (
                <span key={r} className="flex items-center gap-1 text-[11px] text-[#1a2744] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-semibold">
                  <span className="w-4 h-4 bg-[#1a2744] text-white rounded-full text-[9px] flex items-center justify-center font-bold">{i + 1}</span>
                  {r}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* REQUIRED SKILLS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Skills</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="React, NodeJS, Python... press Enter to add"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#1a2744] placeholder-slate-400 focus:outline-none focus:border-[#1a2744] focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-[#1a2744] hover:bg-[#243460] text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-semibold"
            >
              <Plus size={15} /> Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-semibold">
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(prev => prev.filter(x => x !== s))}
                    className="text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#1a2744] hover:bg-[#243460] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting Drive...</>
          ) : (
            <><Briefcase size={17} />Post Drive</>
          )}
        </button>

      </form>
    </div>
  )
}
