import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUp, Bot, Briefcase, MessageCircle, Minus, Sparkles, X,
} from 'lucide-react'
import api from '../../api'

const SUGGESTIONS = [
  'Which placement drives are open?',
  'What interview questions should I practise?',
  'What are the eligibility requirements?',
]

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Hi! I can help you explore placement drives, company details, eligibility and interview questions from your college placement records.',
  sources: [],
}

const getRequestErrorMessage = error => {
  const status = error.response?.status
  if (error.response?.data?.message) return error.response.data.message
  if (status === 404) return 'The chatbot endpoint was not found. Restart the backend and try again.'
  if (status) return `The assistant request failed (HTTP ${status}). Please try again.`
  if (error.request) return 'Could not reach the backend. Check that it is running and try again.'
  return 'I could not send that message. Please try again.'
}

export default function PlacementChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    inputRef.current?.focus()
  }, [open, messages, sending])

  const sendMessage = async value => {
    const content = (value ?? draft).trim()
    if (!content || sending) return

    const history = messages
      .filter(item => item !== WELCOME_MESSAGE)
      .map(({ role, content: text }) => ({ role, content: text }))
    const userMessage = { role: 'user', content }
    setMessages(current => [...current, userMessage])
    setDraft('')
    setSending(true)

    try {
      const { data } = await api.post('/chatbot', { message: content, history })
      setMessages(current => [...current, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }])
    } catch (error) {
      setMessages(current => [...current, {
        role: 'assistant',
        content: getRequestErrorMessage(error),
        sources: [],
        error: true,
      }])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = event => {
    event.preventDefault()
    sendMessage()
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Placement assistant chat"
          className="mb-3 flex h-[min(640px,calc(100dvh-112px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">Placement assistant</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-blue-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  College placement data · Gemini
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize placement assistant"
              className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Minus className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div className={`max-w-[84%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-tr-md bg-blue-700 text-white'
                      : message.error
                        ? 'rounded-tl-md border border-rose-100 bg-rose-50 text-rose-700'
                        : 'rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm'
                  }`}>
                    {message.content}
                  </div>
                  {message.sources?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {message.sources.map(source => (
                        <Link
                          key={`${source.kind}-${source.id}`}
                          to={source.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-2.5 py-2 text-[11px] text-blue-800 transition hover:border-blue-200 hover:bg-blue-50"
                        >
                          {source.kind === 'job'
                            ? <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            : <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                          <span className="min-w-0">
                            <span className="font-semibold">{source.citation} </span>
                            {source.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && !sending && (
              <div className="space-y-2 pl-9">
                <p className="text-[11px] font-medium text-slate-500">Try asking</p>
                {SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="block w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Bot className="h-4 w-4" />
                </span>
                <div role="status" aria-label="Assistant is thinking" className="flex gap-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3">
                  {[0, 1, 2].map(dot => <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: `${dot * 120}ms` }} />)}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSubmit(event)
                  }
                }}
                maxLength={1000}
                rows={1}
                aria-label="Ask a placement question"
                placeholder="Ask about companies, drives, eligibility..."
                className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">Answers are grounded in placement records. Verify important dates with the placement team.</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-label={open ? 'Close placement assistant' : 'Open placement assistant'}
        aria-expanded={open}
        className={`group flex h-14 items-center gap-2.5 rounded-full px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/25 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
          open ? 'bg-slate-800' : 'bg-gradient-to-r from-blue-700 to-indigo-700'
        }`}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5 transition group-hover:scale-110" />}
        <span>{open ? 'Close' : 'Ask AI'}</span>
      </button>
    </div>
  )
}
