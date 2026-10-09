import { Application } from '../models/Application.js'
import { Job } from '../models/Job.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { hasDeadlinePassed } from '../utils/jobDeadline.js'

const STATUS_MESSAGES = {
  shortlisted: 'Congratulations! You have been shortlisted.',
  interview: 'You have been called for an interview round.',
  selected: '🎉 Congratulations! You have been selected!',
  rejected: 'Thank you for applying. Unfortunately, you were not selected.',
  withdrawn: 'Your application has been withdrawn.',
}

// @desc    Apply to a job
// @route   POST /api/applications
// @access  Student
export const applyToJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter } = req.body

    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' })
    }

    const job = await Job.findById(jobId)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (hasDeadlinePassed(job.lastDateToApply)) {
      if (job.status === 'active') {
        job.status = 'closed'
        await job.save()
      }
      return res.status(400).json({
        message: 'The application deadline for this job has passed.',
      })
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        message: 'This job is no longer accepting applications.',
      })
    }

    const existing = await Application.findOne({
      job: jobId,
      student: req.user._id,
    })

    if (existing) {
      return res.status(400).json({
        message: 'You have already applied to this job.',
      })
    }

    // Eligibility Checks
    if (
      job.eligibility?.minCGPA &&
      req.user.cgpa < job.eligibility.minCGPA
    ) {
      return res.status(400).json({
        message: `Minimum CGPA required: ${job.eligibility.minCGPA}. Your CGPA: ${req.user.cgpa}`,
      })
    }

    const maxAllowed = job.eligibility?.backlogs ?? 0
    const studentBacklogs = req.user.backlogs ?? 0

    if (studentBacklogs > maxAllowed) {
      return res.status(400).json({
        message: `This company allows a maximum of ${maxAllowed} backlog(s). You have ${studentBacklogs} backlog(s).`,
      })
    }

    if (
      job.eligibility?.branches?.length > 0 &&
      !job.eligibility.branches.includes(req.user.branch)
    ) {
      return res.status(400).json({
        message: `Your branch (${req.user.branch}) is not eligible for this job.`,
      })
    }

    if (
      job.eligibility?.passingYear?.length > 0 &&
      !job.eligibility.passingYear.includes(req.user.passingYear)
    ) {
      return res.status(400).json({
        message: `Your passing year (${req.user.passingYear}) is not eligible for this job.`,
      })
    }

    // Resume URL (Cloudinary)
    let resumeUrl = null

    if (req.file) {
      // Uploaded to Cloudinary
      resumeUrl = req.file.path
    } else if (req.user.resume || req.user.resumeUrl) {
      // Existing profile resume
      resumeUrl = req.user.resume || req.user.resumeUrl
    }

    if (!resumeUrl) {
      return res.status(400).json({
        message: 'No resume found. Please upload a resume to apply.',
      })
    }

    // Create Application
    const application = await Application.create({
      job: jobId,
      student: req.user._id,
      coverLetter: coverLetter || '',
      resumeUrl,
      statusHistory: [
        {
          status: 'applied',
          changedBy: req.user._id,
        },
      ],
    })

    res.status(201).json({
      application,
      message: 'Application submitted successfully!',
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'You have already applied to this job.',
      })
    }

    next(err)
  }
}

// @desc    Get my applications
export const getMyApplications = async (req, res, next) => {
  try {
    const { status } = req.query

    const filter = { student: req.user._id }

    if (status) {
      filter.status = status
    }

    const applications = await Application.find(filter)
      .populate(
        'job',
        'title company type package location status logo driveDate eligibility'
      )
      .sort({ updatedAt: -1 })

    res.json({
      applications,
      total: applications.length,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update application status
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const {
      status,
      note,
      offeredPackage,
      offerLetterUrl,
      currentRound,
    } = req.body

    const application = await Application.findById(req.params.id)
      .populate('student', 'name email')

    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
      })
    }

    application.status = status

    if (note) application.notes = note
    if (offeredPackage) application.offeredPackage = offeredPackage
    if (offerLetterUrl) application.offerLetterUrl = offerLetterUrl
    if (currentRound) application.currentRound = currentRound

    application.statusHistory.push({
      status,
      changedBy: req.user._id,
      note,
    })

    await application.save()

    await Notification.create({
      recipient: application.student._id,
      type:
        status === 'selected'
          ? 'selected'
          : status === 'rejected'
          ? 'rejected'
          : status === 'shortlisted'
          ? 'shortlisted'
          : 'application_update',
      title: 'Application Update',
      message:
        STATUS_MESSAGES[status] ||
        `Your application status has been updated to: ${status}`,
      link: '/applications',
      relatedApplication: application._id,
    })

    res.json({
      application,
      message: `Status updated to ${status}`,
    })
  } catch (err) {
    next(err)
  }
}

// @desc Withdraw Application
export const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      student: req.user._id,
    })

    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
      })
    }

    if (
      application.status === 'selected' ||
      application.status === 'rejected'
    ) {
      return res.status(400).json({
        message: 'Cannot withdraw a finalized application.',
      })
    }

    application.status = 'withdrawn'

    application.statusHistory.push({
      status: 'withdrawn',
      changedBy: req.user._id,
    })

    await application.save()

    res.json({
      message: 'Application withdrawn successfully',
    })
  } catch (err) {
    next(err)
  }
}

// @desc Get All Applications
export const getAllApplications = async (req, res, next) => {
  try {
    const { jobId, status, page = 1, limit = 20 } = req.query

    const filter = {}

    if (jobId) filter.job = jobId
    if (status) filter.status = status

    const applications = await Application.find(filter)
      .populate(
        'student',
        'name email branch cgpa rollNumber hasBacklog backlogs photo prn dob address resume phone domain passingYear'
      )
      .populate('job', 'title company')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await Application.countDocuments(filter)

    res.json({
      applications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    next(err)
  }
}