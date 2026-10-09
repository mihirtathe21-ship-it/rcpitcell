import express from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

import cloudinary from '../config/cloudinary.js'
import { User } from '../models/User.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// ─────────────────────────────────────────────────────────────
// Cloudinary Storage
// ─────────────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Photo Upload
    if (file.fieldname === 'photo') {
      return {
        folder: 'photos',
        resource_type: 'image',
        public_id: `${req.user._id}-photo-${Date.now()}`,
      }
    }

    // Resume Upload
    if (file.fieldname === 'resume') {
      return {
        folder: 'resumes',
        resource_type: 'raw',
        public_id: `${req.user._id}-resume-${Date.now()}`,
      }
    }
  },
})

// ─────────────────────────────────────────────────────────────
// File Validation
// ─────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photo') {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true)
    } else {
      return cb(new Error('Only image files allowed'), false)
    }
  }

  if (file.fieldname === 'resume') {
    if (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      return cb(null, true)
    } else {
      return cb(new Error('Only PDF resume allowed'), false)
    }
  }

  cb(null, false)
}

// ─────────────────────────────────────────────────────────────
// Multer Setup
// ─────────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// ─────────────────────────────────────────────────────────────
// GET All Users (Admin)
// ─────────────────────────────────────────────────────────────
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query

    const filter = {}

    if (role) filter.role = role

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await User.countDocuments(filter)

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// GET Students
// ─────────────────────────────────────────────────────────────
router.get(
  '/students',
  protect,
  authorize('admin', 'tpo'),
  async (req, res, next) => {
    try {
      const students = await User.find({ role: 'student' })
        .select('-password')
        .sort({ cgpa: -1 })

      res.json({
        students,
        total: students.length,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────
// Import Students
// ─────────────────────────────────────────────────────────────
router.post(
  '/import-students',
  protect,
  authorize('tpo', 'admin'),
  async (req, res, next) => {
    try {
      const { students } = req.body

      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          message: 'No student data provided',
        })
      }

      let created = 0
      let updated = 0
      let failed = 0
      const errors = []

      for (const row of students) {
        try {
          const name = row['Name'] || row['name']
          const email = row['Email'] || row['email']
          const phone =
            row['Phone'] ||
            row['phone'] ||
            row['Mobile'] ||
            '0000000000'

          const rollNumber =
            row['RollNumber'] ||
            row['Roll Number'] ||
            row['rollNumber']

          const branch =
            row['Branch'] ||
            row['branch'] ||
            row['Department']

          const passingYear =
            parseInt(
              row['PassingYear'] ||
              row['Passing Year'] ||
              row['passingYear']
            ) || null

          const cgpa =
            parseFloat(
              row['CGPA'] ||
              row['cgpa']
            ) || null

          if (!email) {
            failed++
            continue
          }

          const existing = await User.findOne({ email })

          if (existing) {
            await User.findByIdAndUpdate(existing._id, {
              ...(cgpa !== null && { cgpa }),
              ...(branch && { branch }),
              ...(passingYear && { passingYear }),
              ...(rollNumber && { rollNumber }),
            })

            updated++
          } else {
            if (!name) {
              failed++
              continue
            }

            const password = await bcrypt.hash(
              'PlaceNext@123',
              10
            )

            await User.create({
              name,
              email,
              phone,
              rollNumber,
              branch,
              passingYear,
              cgpa,
              role: 'student',
              password,
              isActive: true,
            })

            created++
          }
        } catch (e) {
          failed++
          errors.push(e.message)
        }
      }

      res.json({
        message: `Import complete`,
        created,
        updated,
        failed,
        errors,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE (Student)
// ─────────────────────────────────────────────────────────────
router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      const { prn, dob, address } = req.body;

      const updates = {};

      if (prn) updates.prn = prn;
      if (dob) updates.dob = dob;
      if (address) updates.address = address;

      // photo
      if (req.files?.photo?.[0]) {
        updates.photo = req.files.photo[0].path;
      }

      // resume
      if (req.files?.resume?.[0]) {
        updates.resume = req.files.resume[0].path;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      return res.json({
        success: true,
        message: "Profile updated successfully",
        user,
      });

    } catch (error) {
      console.log("PROFILE UPDATE ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  '/profile/resume/preview',
  protect,
  authorize('student'),
  async (req, res, next) => {
    try {
      if (!req.user.resume) {
        return res.status(404).json({ message: 'No resume is uploaded to your profile.' })
      }

      let resumeUrl
      try {
        resumeUrl = new URL(req.user.resume)
      } catch {
        return res.status(404).json({ message: 'The uploaded resume could not be found.' })
      }

      if (resumeUrl.protocol !== 'https:' || resumeUrl.hostname !== 'res.cloudinary.com') {
        return res.status(404).json({ message: 'The uploaded resume could not be found.' })
      }

      const response = await fetch(resumeUrl, { redirect: 'error' })
      if (!response.ok) {
        return res.status(502).json({ message: 'The resume could not be loaded from storage.' })
      }

      const resume = Buffer.from(await response.arrayBuffer())
      if (resume.subarray(0, 5).toString() !== '%PDF-') {
        return res.status(502).json({ message: 'The stored resume is not a valid PDF.' })
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
        'Content-Length': resume.length,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      return res.send(resume)
    } catch (error) {
      return next(error)
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET Single User
// ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  protect,
  authorize('admin', 'tpo'),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id)
        .select('-password')

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        })
      }

      res.json({ user })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────
// Update Student by TPO/Admin
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/profile',
  protect,
  authorize('tpo', 'admin'),
  async (req, res, next) => {
    try {
      const allowed = [
        'cgpa',
        'branch',
        'passingYear',
        'rollNumber',
        'phone',
      ]

      const update = {}

      allowed.forEach((field) => {
        if (req.body[field] !== undefined) {
          update[field] = req.body[field]
        }
      })

      const user = await User.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      ).select('-password')

      res.json({
        user,
        message: 'Profile updated',
      })
    } catch (err) {
      next(err)
    }
  }
)

// ─────────────────────────────────────────────────────────────
// Activate / Deactivate User
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
      ).select('-password')

      res.json({
        user,
        message: 'Status updated',
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router