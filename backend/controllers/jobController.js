import { Job } from '../models/Job.js'
import { Application } from '../models/Application.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { sendJobNotificationEmail } from '../utils/emailService.js'   // ← ADD THIS LINE
import { closeExpiredActiveJobs } from '../utils/jobDeadline.js'

// Helper: notify all eligible students when a job is posted
const notifyEligibleStudents = async (job) => {
  try {
    const filter = { role: 'student', isActive: true }
    if (job.eligibility?.branches?.length > 0) {
      filter.branch = { $in: job.eligibility.branches }
    }
    if (job.eligibility?.passingYear?.length > 0) {
      filter.passingYear = { $in: job.eligibility.passingYear }
    }
    if (job.eligibility?.minCGPA > 0) {
      filter.cgpa = { $gte: job.eligibility.minCGPA }
    }

    // ── fetch name + email too (needed for email sending) ──
    const students = await User.find(filter).select('_id name email')

    // ── 1. In-app notifications (existing) ──
    const notifications = students.map(s => ({
      recipient: s._id,
      type: 'job_posted',
      title: `New Drive: ${job.company}`,
      message: `${job.company} is hiring for ${job.title}.`,
      link: `/jobs`,
      relatedJob: job._id,
    }))
    if (notifications.length) await Notification.insertMany(notifications)

    // ── 2. Email notifications (NEW) ──
    // Send in batches of 10 to respect Gmail rate limits
    const BATCH = 10
    for (let i = 0; i < students.length; i += BATCH) {
      const batch = students.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map(s =>
          sendJobNotificationEmail(s.email, s.name, job).catch(err =>
            console.error(`Email failed for ${s.email}:`, err.message)
          )
        )
      )
      // 1 second pause between batches
      if (i + BATCH < students.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`✅ Notified ${students.length} students about: ${job.company} - ${job.title}`)
  } catch (err) {
    console.error('Notification error:', err.message)
  }
}

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req, res, next) => {
  try {
    await closeExpiredActiveJobs()
    const { status, type, branch, page = 1, limit = 12, search } = req.query

    const filter = {}
    if (status) filter.status = status
    if (type)   filter.type = type
    if (branch) filter['eligibility.branches'] = branch
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { title:   { $regex: safeSearch, $options: 'i' } },
        { company: { $regex: safeSearch, $options: 'i' } },
      ]
    }

    if (req.user.role === 'student' && !status) {
      filter.status = { $in: ['active', 'upcoming'] }
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name companyName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Job.countDocuments(filter),
    ])

    if (req.user.role === 'student') {
      const jobIds = jobs.map(j => j._id)
      const applications = await Application.find({
        student: req.user._id,
        job: { $in: jobIds },
      }).select('job status')

      const appMap = {}
      applications.forEach(a => { appMap[a.job.toString()] = a.status })

      const jobsWithStatus = jobs.map(j => ({
        ...j.toObject(),
        applicationStatus: appMap[j._id.toString()] || null,
      }))

      return res.json({
        jobs: jobsWithStatus,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      })
    }

    const applicantCounts = await Application.aggregate([
      { $match: { job: { $in: jobs.map(job => job._id) } } },
      { $group: { _id: '$job', count: { $sum: 1 } } },
    ])
    const applicantCountByJob = new Map(applicantCounts.map(item => [item._id.toString(), item.count]))
    const jobsWithApplicantCounts = jobs.map(job => ({
      ...job.toObject(),
      applicantCount: applicantCountByJob.get(job._id.toString()) || 0,
    }))

    res.json({
      jobs: jobsWithApplicantCounts,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
export const getJob = async (req, res, next) => {
  try {
    await closeExpiredActiveJobs()
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name companyName email')
    if (!job) return res.status(404).json({ message: 'Job not found' })

    let applicationStatus = null
    if (req.user.role === 'student') {
      const app = await Application.findOne({ job: job._id, student: req.user._id })
      applicationStatus = app?.status || null
    }

    const applicantCount = await Application.countDocuments({ job: job._id })
    res.json({ job, applicationStatus, applicantCount })
  } catch (err) {
    next(err)
  }
}

// @desc    Create job
// @route   POST /api/jobs
// @access  TPO + Recruiter + Admin
export const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      ...req.body,
      ...(req.file && { logo: req.file.path }),
      postedBy: req.user._id,
    })
    await notifyEligibleStudents(job)   // sends both in-app + email now
    res.status(201).json({ job, message: 'Job posted successfully' })
  } catch (err) {
    next(err)
  }
}

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  TPO + Recruiter (own) + Admin
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' })
    }

    const updates = { ...req.body }
    if (req.file) updates.logo = req.file.path

    const updated = await Job.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    })
    res.json({ job: updated, message: 'Job updated successfully' })
  } catch (err) {
    next(err)
  }
}

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Admin + TPO + Recruiter (own)
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'tpo' &&
      job.postedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await Job.findByIdAndDelete(req.params.id)
    await Application.deleteMany({ job: req.params.id })
    res.json({ message: 'Job and related applications deleted' })
  } catch (err) {
    next(err)
  }
}

// @desc    Get applicants for a job
// @route   GET /api/jobs/:id/applicants
// @access  TPO + Recruiter + Admin
export const getApplicants = async (req, res, next) => {
  try {
    const { status } = req.query
    const filter = { job: req.params.id }
    if (status) filter.status = status

    const applications = await Application.find(filter)
      .populate(
        'student',
        'name email phone branch cgpa rollNumber passingYear ' +
        'photo prn dob address resume domain hasBacklog backlogs'
      )
      .sort({ createdAt: -1 })

    res.json({ applications, total: applications.length })
  } catch (err) {
    next(err)
  }
}