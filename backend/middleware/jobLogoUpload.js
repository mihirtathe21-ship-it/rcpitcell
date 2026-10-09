import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'company-logos',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Company logo must be a JPG, PNG, or WEBP image.')
      error.statusCode = 400
      return callback(error)
    }
    callback(null, true)
  },
})

export const uploadJobLogo = (req, res, next) => {
  upload.single('logo')(req, res, error => {
    if (error) {
      if (error instanceof multer.MulterError) error.statusCode = 400
      return next(error)
    }
    next()
  })
}

export const parseJobPayload = (req, res, next) => {
  if (typeof req.body.job !== 'string') return next()

  try {
    const job = JSON.parse(req.body.job)
    if (!job || typeof job !== 'object' || Array.isArray(job)) {
      return res.status(400).json({ message: 'Invalid placement drive details.' })
    }
    req.body = job
    return next()
  } catch {
    return res.status(400).json({ message: 'Invalid placement drive details.' })
  }
}
