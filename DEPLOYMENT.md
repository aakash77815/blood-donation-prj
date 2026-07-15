# Deployment Guide

This guide deploys the backend to **Render** (free tier friendly) and the frontend to **Vercel** (free tier friendly). The same principles apply if you use Railway, Fly.io, Netlify, etc. instead — only the exact UI steps differ.

## Before you start
- Push your project to a GitHub repository (Render and Vercel both deploy from Git).
- Make sure `.env` is in `.gitignore` in both `backend/` and `frontend/` — **never commit real secrets to GitHub.**
- Have your MongoDB Atlas connection string ready.

---

## Part 1: Deploy the Backend (Render)

1. Go to [render.com](https://render.com) → sign up / log in (GitHub login is easiest).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository and select it.
4. Configure:
   - **Root Directory:** `backend` (important — tells Render to only build/run this subfolder)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment Variables**, add every variable from your `backend/.env` file:
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=<your real Atlas connection string>
   JWT_SECRET=<your real secret>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=<your Vercel frontend URL — you'll get this in Part 2, update it after>
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=<your real Gmail address>
   EMAIL_PASS=<your real Gmail App Password — see note below>
   ```
   **Note on `PORT`:** Render assigns its own port via the `PORT` env var automatically — your `server.js` already reads `process.env.PORT`, so this works without code changes.
6. Click **Create Web Service**. Render will build and deploy — this takes a few minutes.
7. Once live, copy your backend's URL (something like `https://your-app.onrender.com`).

### Getting a Gmail "App Password" for `EMAIL_PASS`
Gmail blocks regular password login for apps. You need an **App Password** instead:
1. Go to your Google Account → **Security**.
2. Enable **2-Step Verification** (required first, if not already on).
3. Search for **"App Passwords"** in account settings.
4. Generate one for "Mail" — copy the 16-character password shown.
5. Use that (not your real Gmail password) as `EMAIL_PASS`.

### Whitelist Render's IPs in MongoDB Atlas
Since Render's servers don't have a fixed IP on the free tier, go to Atlas → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`). This is fine for a project/demo; a real production system would use a paid tier with static IPs instead.

---

## Part 2: Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → sign up / log in with GitHub.
2. Click **Add New** → **Project** → select your repository.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (should auto-detect)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```
   (Use your **real** Render backend URL from Part 1, with `/api` at the end.)
5. Click **Deploy**.
6. Once live, copy your frontend's URL (something like `https://your-app.vercel.app`).

---

## Part 3: Connect Them (final step — easy to forget)

Go back to **Render** → your backend service → **Environment** → update:
```
CLIENT_URL=https://your-app.vercel.app
```
This is what your backend's CORS config (`src/app.js`) uses to decide which frontend is allowed to call it. Save — Render will automatically redeploy with the new value.

Without this step, your deployed frontend will get CORS errors when calling the deployed backend, even though everything else works.

---

## Common deployment issues

| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls fail with CORS errors | `CLIENT_URL` on the backend doesn't match your actual Vercel URL exactly (check for trailing slashes, http vs https) |
| Backend deploys but crashes immediately | Check Render's logs — usually a missing/wrong environment variable (especially `MONGO_URI`) |
| MongoDB connection times out on Render but works locally | Atlas Network Access hasn't been set to allow `0.0.0.0/0` |
| Emails don't send in production | Gmail App Password wasn't set up, or 2-Step Verification isn't enabled on that Google account |
| Free tier backend feels slow on first request | Render's free tier "spins down" after inactivity — the first request after idle time can take 30-60 seconds to wake up. This is a free-tier limitation, not a bug. |
