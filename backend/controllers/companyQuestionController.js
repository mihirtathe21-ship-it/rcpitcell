import { CompanyQuestion } from '../models/CompanyQuestion.js'
import { Job } from '../models/Job.js'

const normalizeQuestions = questions => {
  if (!Array.isArray(questions)) return []

  return questions.map(question => {
    if (typeof question === 'string') {
      return { round: 'General', text: question.trim() }
    }

    return {
      round: typeof question.round === 'string' ? question.round.trim() : '',
      text: typeof question.text === 'string' ? question.text.trim() : '',
    }
  }).filter(question => question.round && question.text)
}

const getQuestionData = body => ({
  company: typeof body.company === 'string' ? body.company.trim() : '',
  role: typeof body.role === 'string' ? body.role.trim() : '',
  year: body.year === '' || body.year === undefined || body.year === null
    ? undefined
    : Number(body.year),
  questions: normalizeQuestions(body.questions),
})

const validateQuestionData = ({ company, role, year, questions }) => {
  if (!company || !questions.length) {
    return 'Company and at least one round-grouped question are required.'
  }
  if (role !== undefined && typeof role !== 'string') {
    return 'Role must be text.'
  }
  if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
    return 'Year must be a valid year.'
  }
  return null
}

export const getCompanyQuestions = async (req, res, next) => {
  try {
    const questions = await CompanyQuestion.find()
      .sort({ company: 1, year: -1, role: 1 })
      .lean()

    res.json({
      questions: questions.map(question => ({
        ...question,
        questions: normalizeQuestions(question.questions),
      })),
    })
  } catch (err) {
    next(err)
  }
}

export const getCompanyOptions = async (req, res, next) => {
  try {
    const [driveCompanies, savedCompanies] = await Promise.all([
      Job.distinct('company'),
      CompanyQuestion.distinct('company'),
    ])

    const normalizeNames = names => [...new Set(
      names.filter(name => typeof name === 'string' && name.trim())
        .map(name => name.trim())
    )].sort((a, b) => a.localeCompare(b))

    res.json({
      driveCompanies: normalizeNames(driveCompanies),
      savedCompanies: normalizeNames(savedCompanies),
    })
  } catch (err) {
    next(err)
  }
}

export const createCompanyQuestion = async (req, res, next) => {
  try {
    const data = getQuestionData(req.body)
    const validationMessage = validateQuestionData(data)
    if (validationMessage) return res.status(400).json({ message: validationMessage })

    const escapedCompany = data.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const existingQuestionSet = await CompanyQuestion.findOne({
      company: { $regex: `^${escapedCompany}$`, $options: 'i' },
    }).sort({ createdAt: 1 }).lean()

    if (existingQuestionSet) {
      const existingQuestions = normalizeQuestions(existingQuestionSet.questions)
      const existingKeys = new Set(
        existingQuestions.map(question => `${question.round.toLowerCase()}\u0000${question.text.toLowerCase()}`)
      )
      const newQuestions = []
      data.questions.forEach(question => {
        const key = `${question.round.toLowerCase()}\u0000${question.text.toLowerCase()}`
        if (!existingKeys.has(key)) {
          existingKeys.add(key)
          newQuestions.push(question)
        }
      })

      const mergedQuestions = [...existingQuestions, ...newQuestions]
      const question = await CompanyQuestion.findByIdAndUpdate(
        existingQuestionSet._id,
        { $set: { questions: mergedQuestions } },
        { new: true, runValidators: true }
      ).lean()

      return res.json({
        question,
        message: newQuestions.length
          ? 'Questions added to the company question bank.'
          : 'These questions are already in the company question bank.',
      })
    }

    const question = await CompanyQuestion.create({
      ...data,
      addedBy: req.user._id,
    })

    res.status(201).json({ question, message: 'Previous-year questions added.' })
  } catch (err) {
    next(err)
  }
}

export const updateCompanyQuestion = async (req, res, next) => {
  try {
    const data = getQuestionData(req.body)
    const validationMessage = validateQuestionData(data)
    if (validationMessage) return res.status(400).json({ message: validationMessage })

    const update = {
      company: data.company,
      questions: data.questions,
    }
    if (req.body.role !== undefined) update.role = data.role
    if (data.year !== undefined) update.year = data.year

    const question = await CompanyQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    )

    if (!question) return res.status(404).json({ message: 'Question entry not found.' })
    res.json({ question, message: 'Question entry updated.' })
  } catch (err) {
    next(err)
  }
}

export const deleteCompanyQuestion = async (req, res, next) => {
  try {
    const question = await CompanyQuestion.findByIdAndDelete(req.params.id)
    if (!question) return res.status(404).json({ message: 'Question entry not found.' })
    res.json({ message: 'Question entry deleted.' })
  } catch (err) {
    next(err)
  }
}
