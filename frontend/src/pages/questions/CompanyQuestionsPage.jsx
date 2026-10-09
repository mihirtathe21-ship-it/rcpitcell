import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen, Building2, CheckCircle2, Loader2, Plus, Save, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

const ROUNDS = ['Aptitude', 'Coding', 'Technical', 'HR', 'Group Discussion', 'Other']
const EMPTY_FORM = { company: '', newCompany: '', sections: [{ round: 'Aptitude', questions: '' }] }

const normalizeQuestions = questions => (
  (questions || []).map(question => (
    typeof question === 'string'
      ? { round: 'General', text: question }
      : { round: question.round || 'General', text: question.text || '' }
  )).filter(question => question.text)
)

const getApiErrorMessage = (error, action) => {
  const responseMessage = error.response?.data?.message
  if (responseMessage) return responseMessage
  if (error.response?.status === 404) {
    return 'The question API is not loaded by the backend. Restart the backend from the backend folder and try again.'
  }
  if (error.response) {
    return `${action} failed (HTTP ${error.response.status}). Check the backend logs for details.`
  }
  if (error.request) {
    return 'Cannot reach the backend at http://localhost:5000. Start the backend from the backend folder and try again.'
  }
  return error.message || `${action} failed.`
}

export default function CompanyQuestionsPage({ manageOnly = false }) {
  const { user } = useAuth()
  const canManage = manageOnly ? user?.role === 'tpo' : ['tpo', 'admin'].includes(user?.role)
  const [entries, setEntries] = useState([])
  const [driveCompanies, setDriveCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const requests = [api.get('/company-questions')]
      if (canManage) requests.push(api.get('/company-questions/companies'))

      const [questionsResponse, companiesResponse] = await Promise.all(requests)
      setEntries(questionsResponse.data.questions)
      if (companiesResponse) setDriveCompanies(companiesResponse.data.driveCompanies)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Loading previous-year questions'))
    } finally {
      setLoading(false)
    }
  }, [canManage])

  useEffect(() => { loadData() }, [loadData])

  const savedCompanies = useMemo(
    () => [...new Set(entries.map(entry => entry.company))].sort((a, b) => a.localeCompare(b)),
    [entries]
  )

  const selectedQuestions = useMemo(
    () => entries
      .filter(entry => entry.company === selectedCompany)
      .flatMap(entry => normalizeQuestions(entry.questions)),
    [entries, selectedCompany]
  )

  const groupedQuestions = useMemo(() => {
    const groups = new Map()
    selectedQuestions.forEach(question => {
      const roundQuestions = groups.get(question.round) || []
      roundQuestions.push(question.text)
      groups.set(question.round, roundQuestions)
    })
    return [...groups.entries()]
  }, [selectedQuestions])

  const updateSection = (index, updates) => {
    setForm(current => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) => (
        sectionIndex === index ? { ...section, ...updates } : section
      )),
    }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
  }

  const submitForm = async event => {
    event.preventDefault()
    const company = (form.company === '__new__' ? form.newCompany : form.company).trim()
    const questions = form.sections.flatMap(section => (
      section.questions.split('\n')
        .map(text => ({ round: section.round.trim(), text: text.trim() }))
        .filter(question => question.round && question.text)
    ))

    if (!company) {
      toast.error('Select an existing company or enter a new company name.')
      return
    }
    if (!questions.length) {
      toast.error('Enter at least one question under an interview round.')
      return
    }

    setSaving(true)
    setSavedMessage('')
    try {
      const { data } = await api.post('/company-questions', { company, questions })
      setSelectedCompany(company)
      toast.success(data.message || 'Questions saved to MongoDB.')
      setSavedMessage(`${questions.length} question${questions.length === 1 ? '' : 's'} saved for ${company}. Students can now view them.`)
      resetForm()
      await loadData()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Saving questions'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Previous Year Questions</h1>
            <p className="text-sm text-gray-500">
              {canManage ? 'Add company questions for students to practise.' : 'Choose a company to view its interview questions.'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {canManage && (
          <form onSubmit={submitForm} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add company questions</h2>
              <p className="mt-1 text-sm text-gray-500">
                Select a company with a posted drive, or add a new company. Questions are saved to MongoDB and appear in the student view.
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Company
              <select
                required
                value={form.company}
                onChange={event => {
                  setForm(current => ({ ...current, company: event.target.value, newCompany: '' }))
                  setSavedMessage('')
                }}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a company</option>
                {driveCompanies.length > 0 && (
                  <optgroup label="Companies with posted drives">
                    {driveCompanies.map(company => <option key={company} value={company}>{company}</option>)}
                  </optgroup>
                )}
                {savedCompanies.length > 0 && (
                  <optgroup label="Companies with saved questions">
                    {savedCompanies
                      .filter(company => !driveCompanies.includes(company))
                      .map(company => <option key={company} value={company}>{company}</option>)}
                  </optgroup>
                )}
                <optgroup label="Add a new company">
                  <option value="__new__">+ Add a new company</option>
                </optgroup>
              </select>
            </label>

            {form.company === '__new__' && (
              <label className="mt-4 block text-sm font-medium text-gray-700">
                New company name
                <input
                  required
                  value={form.newCompany}
                  onChange={event => setForm(current => ({ ...current, newCompany: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter the company name"
                />
              </label>
            )}

            <div className="mt-5 space-y-4">
              {form.sections.map((section, index) => (
                <section key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-end gap-3">
                    <label className="flex-1 text-sm font-medium text-gray-700">
                      Interview round
                      <select
                        value={section.round}
                        onChange={event => updateSection(index, { round: event.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
                      >
                        {[...new Set([...ROUNDS, ...form.sections.map(item => item.round)])].map(round => (
                          <option key={round} value={round}>{round}</option>
                        ))}
                      </select>
                    </label>
                    {form.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm(current => ({
                          ...current,
                          sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
                        }))}
                        className="rounded-lg p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove interview round"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <label className="mt-3 block text-sm font-medium text-gray-700">
                    Questions for {section.round}
                    <textarea
                      required
                      rows="4"
                      value={section.questions}
                      onChange={event => updateSection(index, { questions: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder={'Enter one question per line'}
                    />
                  </label>
                </section>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setForm(current => ({
                    ...current,
                    sections: [...current.sections, { round: 'Technical', questions: '' }],
                  }))}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" /> Add interview round
                </button>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving to MongoDB…' : 'Save questions'}
                </button>
              </div>
            </div>
            {savedMessage && (
              <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {savedMessage}
              </div>
            )}
          </form>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="max-w-xl">
            <label className="block text-sm font-semibold text-gray-800">
              Select a company
              <select
                value={selectedCompany}
                onChange={event => setSelectedCompany(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Choose a company to view questions</option>
                {savedCompanies.map(company => <option key={company} value={company}>{company}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading questions…
            </div>
          ) : !selectedCompany ? (
            <div className="py-14 text-center">
              <Building2 className="mx-auto h-9 w-9 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                {savedCompanies.length ? 'Select a company above to view its questions.' : 'No company questions have been saved yet.'}
              </p>
            </div>
          ) : groupedQuestions.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No questions are saved for {selectedCompany}.
            </div>
          ) : (
            <div className="mt-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Company questions</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">{selectedCompany}</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {selectedQuestions.length} {selectedQuestions.length === 1 ? 'question' : 'questions'}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {groupedQuestions.map(([round, questions]) => (
                  <section key={round} className="overflow-hidden rounded-xl border border-slate-200">
                    <h3 className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
                      {round} Round
                    </h3>
                    <ol className="list-decimal space-y-3 px-4 py-4 pl-9 text-sm leading-relaxed text-slate-700">
                      {questions.map((question, index) => <li key={`${round}-${index}`} className="pl-1">{question}</li>)}
                    </ol>
                  </section>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
