import express from 'express'
import { askPlacementChatbot } from '../controllers/chatbotController.js'
import { authorize, protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('student'), askPlacementChatbot)

export default router
