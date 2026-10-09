import './config/env.js'

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import jobRoutes from './routes/JobRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import analyticsRoutes from './routes/Analyticsroutes.js'
import notificationRoutes from './routes/Notificationroutes.js'
import studentRoutes from './routes/studentRoutes.js'
import companyQuestionRoutes from './routes/companyQuestionRoutes.js'

import errorHandler from './middleware/errorHandler.js'

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)

// Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Online users
const onlineUsers = new Map()

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`)

  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id)
    console.log(`👤 User ${userId} registered`)
  })

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId)
        break
      }
    }
  })
})

// Notification helper
export const sendRealtimeNotification = (userId, notification) => {
  const socketId = onlineUsers.get(userId.toString())

  if (socketId) {
    io.to(socketId).emit('notification', notification)
  }
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
}))

// Static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
)

// Do not accept API traffic until persistence is ready.
await connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/company-questions', companyQuestionRoutes)

// Health route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 PlaceNext API running',
  })
})

// Error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000

httpServer.listen(PORT, () => {
  console.log(`🚀 PlaceNext API running on port ${PORT}`)
})