import mongoose from 'mongoose'

const questionItemSchema = new mongoose.Schema({
  round: {
    type: String,
    required: [true, 'Interview round is required'],
    trim: true,
  },
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
}, { _id: false })

const companyQuestionSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  role: {
    type: String,
    trim: true,
    default: '',
  },
  year: {
    type: Number,
    min: 1900,
    max: 2100,
  },
  questions: {
    type: [questionItemSchema],
    validate: {
      validator: questions => questions.length > 0 && questions.every(question => question.round && question.text),
      message: 'At least one non-empty question is required',
    },
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
})

companyQuestionSchema.index({ company: 1, year: -1 })

export const CompanyQuestion = mongoose.model('CompanyQuestion', companyQuestionSchema)
