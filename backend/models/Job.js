import mongoose from 'mongoose'
 
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  type: {
    type: String,
    enum: ['full-time', 'internship', 'contract'],
    default: 'full-time',
  },
  location: { type: String, default: 'On-Campus' },
  package: { type: String }, // e.g. "12 LPA" or "₹50,000/month"
  stipend: { type: String }, // for internships
  eligibility: {
    branches:    [{ type: String }],
    minCGPA:     { type: Number, default: 0 },
    passingYear: [{ type: Number }],
    // ← MAX allowed active backlogs — 0 means zero-backlog companies
    backlogs:    { type: Number, default: 0 },
  },
  driveDate:       { type: Date },
  lastDateToApply: { type: Date },
  rounds: [{ type: String }], // e.g. ["Aptitude", "Technical", "HR"]
  status: {
    type: String,
    enum: ['upcoming', 'active', 'closed', 'cancelled'],
    default: 'active',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  logo:     { type: String }, // URL
  skills:   [{ type: String }],
  openings: { type: Number, default: 1 },
}, {
  timestamps: true,
})
 
jobSchema.index({ status: 1, createdAt: -1 })
jobSchema.index({ status: 1, lastDateToApply: 1 })
jobSchema.index({ 'eligibility.branches': 1 })
// ← NEW: speeds up backlog-based eligibility filtering
jobSchema.index({ 'eligibility.backlogs': 1 })
 
export const Job = mongoose.model('Job', jobSchema)