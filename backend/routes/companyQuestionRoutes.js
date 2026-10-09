import express from 'express'
import {
  createCompanyQuestion,
  deleteCompanyQuestion,
  getCompanyOptions,
  getCompanyQuestions,
  updateCompanyQuestion,
} from '../controllers/companyQuestionController.js'
import { authorize, protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.get('/companies', authorize('tpo', 'admin'), getCompanyOptions)
router.get('/', getCompanyQuestions)
router.post('/', authorize('tpo', 'admin'), createCompanyQuestion)
router.put('/:id', authorize('tpo', 'admin'), updateCompanyQuestion)
router.delete('/:id', authorize('tpo', 'admin'), deleteCompanyQuestion)

export default router
