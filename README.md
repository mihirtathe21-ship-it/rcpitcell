# 🎓 PlaceNext — Placement Analysis Web Application

A modern, role-based placement portal built with React + Node.js + MongoDB.

---

## 📁 Project Structure

```
placement-app/
├── frontend/                  # React (Vite) app
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx   # Private + Public route guards
│   │   │   ├── layout/
│   │   │   │   └── DashboardLayout.jsx  # Sidebar layout for dashboards
│   │   │   └── ui/
│   │   │       └── StatCard.jsx         # Reusable stat card
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Global auth state (JWT + Axios)
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   └── dashboards/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── TPODashboard.jsx
│   │   │       ├── StudentDashboard.jsx
│   │   │       └── RecruiterDashboard.jsx
│   │   ├── styles/index.css             # Tailwind + custom CSS
│   │   ├── App.jsx                      # Router setup
│   │   └── main.jsx                     # Entry point
│   ├── index.html
│   ├── vite.config.js                   # Proxy to backend
│   └── tailwind.config.js
│
└── backend/                   # Node.js + Express API
    ├── config/
    │   ├── db.js               # MongoDB connection
    │   └── seed.js             # Seed Admin + TPO users
    ├── controllers/
    │   └── authController.js   # Register, Login, GetMe
    ├── middleware/
    │   ├── auth.js             # protect() + authorize()
    │   └── errorHandler.js     # Global error handler
    ├── models/
    │   └── User.js             # User schema (all roles)
    ├── routes/
    │   ├── authRoutes.js
    │   └── userRoutes.js
    └── server.js               # Express app entry
```

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

---

### Step 1: Clone & Navigate

```bash
git clone <your-repo>
cd placement-app
```

---

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/placement_db
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Seed Admin & TPO users:
```bash
    npm run seed
```

This creates:
| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| admin | admin@placenext.com   | admin123  |
| tpo   | tpo@placenext.com     | tpo12345  |

Start the backend:
```bash
npm run dev
```
Backend runs at: `http://localhost:5000`

---

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` (optional, Vite proxy handles it in dev):
```bash
cp .env.example .env
```

For local development, the frontend uses Vite's `/api` proxy to `http://localhost:5000`.
For production, set `VITE_API_URL` to the backend API base URL (including `/api`), for example:

```env
VITE_API_URL=https://api.example.com/api
```

If frontend and backend share an origin, leave `VITE_API_URL` unset and route `/api` to the backend in the production web server.
For a separate frontend and backend origin, set backend `CLIENT_URL` to the frontend's public origin so CORS allows the app.

Start the frontend:
```bash
npm run dev
```
Frontend runs at: `http://localhost:3000`

---

## 🔐 Authentication Flow

```
Login/Register ──► POST /api/auth/login (or /register)
                        │
                        ▼
                   JWT Token returned
                        │
                        ▼
               Stored in localStorage
                        │
                        ▼
          Axios sends: Authorization: Bearer <token>
                        │
                        ▼
              protect() middleware verifies
                        │
                        ▼
              Redirect to role dashboard
```

---

## 👥 Role System

| Role      | Registration | Dashboard           | Notes                        |
|-----------|-------------|---------------------|------------------------------|
| Admin     | Manual (DB) | /admin-dashboard    | Full platform control        |
| TPO       | Manual (DB) | /tpo-dashboard      | Manages placement activities |
| Student   | Public form | /student-dashboard  | Browse jobs, apply           |
| Recruiter | Public form | /recruiter-dashboard| Post jobs, view candidates   |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint            | Access  | Description         |
|--------|---------------------|---------|---------------------|
| POST   | /api/auth/register  | Public  | Register student/recruiter |
| POST   | /api/auth/login     | Public  | Login any role      |
| GET    | /api/auth/me        | Private | Get current user    |

### Users
| Method | Endpoint              | Access       | Description         |
|--------|-----------------------|--------------|---------------------|
| GET    | /api/users            | Admin        | Get all users       |
| GET    | /api/users/students   | Admin + TPO  | Get all students    |
| GET    | /api/users/:id        | Admin + TPO  | Get single user     |
| PATCH  | /api/users/:id/status | Admin        | Toggle user status  |

### Previous-Year Questions
| Method | Endpoint                         | Access     | Description                                      |
|--------|----------------------------------|------------|--------------------------------------------------|
| GET    | /api/company-questions           | Private    | Get saved company questions grouped by rounds    |
| GET    | /api/company-questions/companies | TPO + Admin| Get posted-drive and saved company choices       |
| POST   | /api/company-questions           | TPO + Admin| Save questions for a company                     |
| PUT    | /api/company-questions/:id       | TPO + Admin| Update a company's question entry               |
| DELETE | /api/company-questions/:id       | TPO + Admin| Delete a company's question entry               |

---

## 🎨 Tech Stack

**Frontend:** React 18 + Vite, React Router v6, Tailwind CSS, React Hook Form, Axios, React Hot Toast, Lucide Icons

**Backend:** Node.js, Express, Mongoose, bcryptjs, jsonwebtoken

**Database:** MongoDB

---

## 🔧 Next Steps (Step 2+)

- [ ] Job/Drive posting & management
- [ ] Student application tracking
- [ ] Analytics & placement reports
- [ ] Email notifications
- [ ] File uploads (resume, offer letters)
- [ ] Real-time notifications (Socket.io)

https://claude.ai/chat/d8f9ca2c-5f68-4c75-a3fa-6ca91706d17f