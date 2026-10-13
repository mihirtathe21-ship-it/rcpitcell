import { CompanyQuestion } from '../models/CompanyQuestion.js'
import { Application } from '../models/Application.js'
import { Job } from '../models/Job.js'

const CACHE_TTL_MS = 60_000
const MAX_DOCUMENT_CHARS = 5_000
const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'give', 'have', 'how', 'i', 'in', 'is', 'it', 'me', 'of',
  'on', 'please', 'show', 'tell', 'that', 'the', 'their', 'them', 'there',
  'this', 'to', 'us', 'was', 'were', 'what', 'when', 'where', 'which',
  'who', 'will', 'with', 'would', 'you', 'your',
])

let cachedDocuments = null
let cacheExpiresAt = 0
let pendingLoad = null

const cleanText = value => String(value ?? '').replace(/\s+/g, ' ').trim()

const tokenize = value => cleanText(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .split(' ')
  .filter(token => token.length > 1 && !STOP_WORDS.has(token))
  .map(token => token.endsWith('ies') && token.length > 4
    ? `${token.slice(0, -3)}y`
    : token.endsWith('s') && token.length > 4
      ? token.slice(0, -1)
      : token)

export const rankPlacementKnowledge = (query, documents, limit = 5) => {
  const queryTokens = [...new Set(tokenize(query))]
  if (!queryTokens.length) return []

  return documents
    .map(document => {
      const titleTokens = new Set(tokenize(document.title))
      const searchableTokens = new Set(tokenize(document.searchableText))
      const score = queryTokens.reduce((total, token) => (
        total
          + (titleTokens.has(token) ? 4 : 0)
          + (searchableTokens.has(token) ? 1 : 0)
      ), 0)

      return { document, score }
    })
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ document }) => document)
}

const loadDocuments = async () => {
  const [jobs, questionSets, placementOutcomes] = await Promise.all([
    Job.find()
      .select('title company description type location package stipend eligibility driveDate lastDateToApply rounds status skills openings')
      .sort({ updatedAt: -1 })
      .lean(),
    CompanyQuestion.find()
      .select('company role year questions')
      .sort({ updatedAt: -1 })
      .lean(),
    Application.aggregate([
      { $match: { status: 'selected' } },
      {
        $lookup: {
          from: Job.collection.name,
          localField: 'job',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      {
        $group: {
          _id: { $toLower: '$job.company' },
          company: { $first: '$job.company' },
          selections: { $sum: 1 },
        },
      },
      { $match: { selections: { $gte: 3 } } },
      { $sort: { selections: -1 } },
      { $limit: 50 },
    ]),
  ])

  const jobDocuments = jobs.map(job => {
    const title = `${cleanText(job.company)} — ${cleanText(job.title)} placement drive`
    const searchableText = [
      'Company employer hiring recruitment placement drive',
      `Status: ${job.status}`,
      `Type: ${job.type}`,
      `Location: ${job.location}`,
      `Package: ${job.package}`,
      `Stipend: ${job.stipend}`,
      'Eligibility requirements',
      `Minimum CGPA: ${job.eligibility?.minCGPA}`,
      `Eligible branches: ${job.eligibility?.branches?.join(', ')}`,
      `Passing years: ${job.eligibility?.passingYear?.join(', ')}`,
      `Maximum backlogs: ${job.eligibility?.backlogs}`,
      `Drive date: ${job.driveDate}`,
      `Last date to apply: ${job.lastDateToApply}`,
      `Interview rounds: ${job.rounds?.join(', ')}`,
      `Skills: ${job.skills?.join(', ')}`,
      `Openings: ${job.openings}`,
      cleanText(job.description),
    ].filter(Boolean).join('\n').slice(0, MAX_DOCUMENT_CHARS)

    return {
      id: String(job._id),
      kind: 'job',
      title,
      href: `/jobs/${job._id}`,
      searchableText,
    }
  })

  const questionDocuments = questionSets.map(questionSet => {
    const title = `${cleanText(questionSet.company)} interview questions${questionSet.role ? ` — ${cleanText(questionSet.role)}` : ''}${questionSet.year ? ` (${questionSet.year})` : ''}`
    const questionText = (questionSet.questions || [])
      .map(question => `${cleanText(question.round)}: ${cleanText(question.text)}`)
      .join('\n')

    return {
      id: String(questionSet._id),
      kind: 'company_questions',
      title,
      href: '/previous-year-questions',
      searchableText: `Company interview questions previous interview rounds ${questionText}`.slice(0, MAX_DOCUMENT_CHARS),
    }
  })

  const outcomeDocuments = placementOutcomes.map(outcome => {
    const company = cleanText(outcome.company)
    return {
      id: `outcomes-${company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: 'placement_outcomes',
      title: `${company} historical placement outcomes`,
      href: '/jobs',
      searchableText: `Company employer historical hiring placements selected offers: ${outcome.selections}`,
    }
  })

  return [...jobDocuments, ...questionDocuments, ...outcomeDocuments]
}

export const getPlacementKnowledge = async () => {
  if (cachedDocuments && Date.now() < cacheExpiresAt) return cachedDocuments
  if (pendingLoad) return pendingLoad

  pendingLoad = loadDocuments()
    .then(documents => {
      cachedDocuments = documents
      cacheExpiresAt = Date.now() + CACHE_TTL_MS
      return documents
    })
    .finally(() => {
      pendingLoad = null
    })

  return pendingLoad
}
