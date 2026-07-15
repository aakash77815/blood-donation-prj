# 🩸 Smart Blood Donor Finder System

A full-stack MERN application that connects blood donors with people who urgently need blood — supporting donor search by blood group and location, a complete blood-request lifecycle with status tracking, email notifications, and an admin analytics dashboard.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Sample Data](#sample-data)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Additional Documentation](#additional-documentation)

---

## Features

- **Authentication** — JWT-based register/login, bcrypt password hashing, forgot/reset password via email
- **Role-based access** — donor / seeker / admin, enforced on both frontend routes and backend APIs
- **Donor profiles** — full CRUD, availability toggle, soft-delete (deactivation)
- **Donor search** — filter by blood group, city/state, or real geolocation "nearby" search
- **Blood requests** — create a request, donors respond, full status lifecycle (`pending` → `accepted` → `fulfilled`, or `cancelled`/`rejected`)
- **Admin dashboard** — Chart.js visualizations (requests by status, blood group supply/demand, 30-day trend) and a donor-location report table
- **Admin request management** — accept/reject/fulfill any request directly from the website
- **Email notifications** — request confirmation, donor-accepted alert, fulfillment confirmation, password reset link
- **Responsive UI** — mobile hamburger navigation, responsive grids and tables throughout

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Chart.js, Axios, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (via Mongoose) |
| Auth | JWT, bcrypt |
| Email | Nodemailer |
| Deployment | Render (backend), Vercel (frontend) |

## Project Structure

```
smart-blood-donor-finder/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── controllers/     # auth, donor, request, admin business logic
│   │   ├── models/          # User, BloodRequest (Mongoose schemas)
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/      # JWT auth guard, role authorization, error handler, validation
│   │   ├── validators/      # express-validator rules per resource
│   │   └── utils/           # JWT signing, email sending, email templates
│   ├── seed.js              # sample data seed script
│   ├── server.js            # entry point
│   └── .env                 # environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, ProtectedRoute, AdminRoute, StatCard
│   │   ├── context/         # AuthContext (global auth state)
│   │   ├── pages/           # Login, Register, Dashboard, SearchDonors, BloodRequests,
│   │   │                    # AdminDashboard, AdminRequests, ForgotPassword, ResetPassword
│   │   ├── services/        # Axios instance + per-resource API call functions
│   │   └── App.jsx          # routing
│   └── vercel.json          # SPA rewrite config for deployment
├── DEPLOYMENT.md
├── SAMPLE_DATA.md
├── VIVA_QUESTIONS.md
├── PRESENTATION_NOTES.md
└── README.md
```

## Prerequisites

- Node.js (v18 or later recommended)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A Gmail account with an **App Password** for sending emails (see [Environment Variables](#environment-variables))

## Installation & Setup

```bash
git clone <your-repo-url>
cd smart-blood-donor-finder

cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

### `backend/.env`
```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_atlas_connection_string

JWT_SECRET=a_long_random_secret_string
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_character_gmail_app_password
```

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Getting a Gmail App Password: Google Account → Security → enable 2-Step Verification → search "App Passwords" → generate one for "Mail". Use that 16-character value (not your real Gmail password) as `EMAIL_PASS`.

### `frontend/.env`
```env
VITE_API_BASE_URL=/api
```
(In production, set this to your deployed backend URL + `/api` instead — see [Deployment](#deployment).)

## Running the App

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
```
Runs on `http://localhost:5000`. Confirm with `http://localhost:5000/api/health`.

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173`.

## Sample Data

Populate the database with realistic sample donors, a seeker, an admin, and blood requests in various statuses:
```bash
cd backend
node seed.js
```
See `SAMPLE_DATA.md` for the full list of sample accounts, login credentials, and a suggested demo walkthrough.

## API Overview

All endpoints are prefixed with `/api`. Full request/response examples are in each phase's original documentation further down this repo's commit history — the summary below is what's currently live.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `PUT /auth/reset-password/:token` |
| Donors | `GET /donors`, `GET /donors/search`, `GET /donors/:id`, `POST /donors` (admin), `PUT /donors/:id`, `DELETE /donors/:id` |
| Requests | `GET /requests`, `GET /requests/:id`, `POST /requests`, `PATCH /requests/:id/status` (`accept`/`cancel`/`reject`/`fulfill`) |
| Admin Analytics | `GET /admin/stats/overview`, `.../requests-by-status`, `.../requests-by-bloodgroup`, `.../donors-by-bloodgroup`, `.../requests-trend`, `.../top-locations` |

All routes except register/login/forgot-password/reset-password require a `Authorization: Bearer <token>` header. Admin routes additionally require the token's user to have `role: "admin"`.

## Deployment

Full step-by-step instructions for deploying the backend to **Render** and the frontend to **Vercel** (including MongoDB Atlas network access, Gmail App Password setup, and connecting the two deployed services together) are in **`DEPLOYMENT.md`**.

## Additional Documentation

- **`SAMPLE_DATA.md`** — seed script usage and sample login credentials
- **`VIVA_QUESTIONS.md`** — a top-20 quick-fire list plus in-depth Q&A organized by topic (architecture, security, database, frontend, deployment)
- **`PRESENTATION_NOTES.md`** — a suggested slide structure and live-demo script
- **`DEPLOYMENT.md`** — production deployment walkthrough
