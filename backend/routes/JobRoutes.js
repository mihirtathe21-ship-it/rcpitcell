import express from 'express'
import { getJobs, getJob, createJob, updateJob, deleteJob, getApplicants } from '../controllers/jobController.js'
import { protect, authorize } from '../middleware/auth.js'
import { parseJobPayload, uploadJobLogo } from '../middleware/jobLogoUpload.js'

const router = express.Router()

router.get('/', protect, getJobs)
router.get('/:id', protect, getJob)
router.post('/', protect, authorize('tpo', 'recruiter', 'admin'), uploadJobLogo, parseJobPayload, createJob)
router.put('/:id', protect, authorize('tpo', 'recruiter', 'admin'), uploadJobLogo, parseJobPayload, updateJob)
router.delete('/:id', protect, authorize('tpo', 'admin'), deleteJob)
router.get('/:id/applicants', protect, authorize('tpo', 'recruiter', 'admin'), getApplicants)

export default router