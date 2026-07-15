# Viva Questions & Answers — Smart Blood Donor Finder System

Organized by topic. Practice explaining these in your own words rather than memorizing verbatim — examiners can tell the difference, and follow-up questions will expose memorized-but-not-understood answers.

---

## Top 20 Quick-Fire Questions

A condensed set for a fast pre-viva review. Full explanations for each are in the topic sections further below.

1. **What does MERN stand for?** MongoDB, Express.js, React, Node.js.
2. **What is JWT and what does it contain in this project?** A signed token proving identity; here it holds the user's ID and role, with an expiry.
3. **How are passwords stored?** Hashed with bcrypt (salted, 12 rounds) — never in plain text.
4. **What's the difference between authentication and authorization?** Authentication = are you logged in; authorization = are you allowed to do this specific action (role/ownership checks).
5. **Why is the reset password token hashed before storing in the database?** So a database leak alone can't be used to reset anyone's password — only the raw token, which only ever existed in the user's email, works.
6. **What is Mongoose, and why use it?** An ODM for MongoDB — adds schema validation, hooks (e.g. auto-hashing passwords on save), and structured queries on top of raw MongoDB.
7. **What is a 2dsphere index used for here?** Enables geospatial "find donors near this location" queries efficiently.
8. **Explain the blood request status lifecycle.** `pending` → `accepted` (donor only) → `fulfilled` (donor/requester/admin); `cancelled`/`rejected` reachable from pending or accepted, never from fulfilled.
9. **Why validate input on both frontend and backend?** Frontend validation is UX only and can be bypassed; backend validation is the real security/data-integrity boundary.
10. **What HTTP status code is returned when a user tries to edit someone else's data?** `403 Forbidden`.
11. **What status code means "not logged in" vs "logged in but not allowed"?** `401 Unauthorized` vs `403 Forbidden`.
12. **How does the frontend know if a user is logged in after a page refresh?** It checks `localStorage` for a token, then re-validates it against the backend's `/api/auth/me` before trusting it.
13. **What is CORS, and why configure it?** Cross-Origin Resource Sharing — restricts which frontend origin is allowed to call the API; without it, any website could call your API using a logged-in user's browser session.
14. **Why is a soft delete (`isActive: false`) used instead of actually deleting a donor?** Preserves history and avoids breaking references (e.g. a blood request that already points to that donor).
15. **What happens if sending a notification email fails?** It's caught and logged — the underlying action (creating a request, accepting it, etc.) still succeeds regardless, since email is a side effect, not the core operation.
16. **What database is used, and why that choice over a relational database?** MongoDB Atlas — its flexible document model suits nested data (like a user's location or a request's hospital info) without needing join tables.
17. **How does the Admin Dashboard get its chart data?** Backend aggregation endpoints (MongoDB `$group`/`$match` pipelines) return counts by status/blood group/date, which the frontend maps into Chart.js's data format.
18. **What prevents a regular user from reaching `/admin` in the browser?** A frontend `AdminRoute` guard checks the user's role and redirects if not `admin` — backed up by the actual API routes also being protected server-side (the frontend guard is UX, the backend check is the real security).
19. **Why does `forgotPassword` return the same message whether or not the email exists?** To prevent attackers from using it to discover which emails are registered on the platform (user enumeration).
20. **Where is this deployed?** Backend on Render, frontend on Vercel, database on MongoDB Atlas — see `DEPLOYMENT.md`.

---

## 1. General / Architecture

**Q: What is the MERN stack, and where does each piece fit in your project?**
MongoDB (database), Express.js (backend web framework), React (frontend UI library), Node.js (JavaScript runtime the backend runs on). In this project: MongoDB Atlas stores users/requests, Express + Node form the REST API (`backend/`), and React + Vite forms the single-page frontend (`frontend/`).

**Q: Why did you choose MERN over another stack (e.g., Django, Spring Boot)?**
Using JavaScript across both frontend and backend means one language, shared mental model, and a huge npm ecosystem. It's also well-suited to JSON-heavy REST APIs, which this project is built around.

**Q: Explain the folder structure of your backend.**
It follows an MVC-inspired layered structure: `models/` (Mongoose schemas), `controllers/` (business logic), `routes/` (URL → controller mapping), `middleware/` (auth guards, error handling), `validators/` (input validation rules), `utils/` (helpers like email sending, token generation). This separation means each file has one clear responsibility.

**Q: What is REST, and is your API RESTful?**
REST (Representational State Transfer) is an architectural style using HTTP verbs (GET, POST, PUT, PATCH, DELETE) mapped to resource operations. Yes — e.g., `GET /api/donors` lists donors, `POST /api/requests` creates a request, `PATCH /api/requests/:id/status` updates a specific resource's state.

---

## 2. Authentication & Security

**Q: How does JWT authentication work in your project?**
On login/register, the server signs a JWT containing the user's ID and role, using a secret key (`JWT_SECRET`). The client stores this token and sends it in the `Authorization: Bearer <token>` header on every subsequent request. The `protect` middleware verifies the token's signature and expiry, then re-fetches the user from the database to attach to `req.user`.

**Q: Why re-fetch the user from the database instead of trusting the token's contents?**
A JWT is only verified for authenticity (was it signed by us, has it expired) — it doesn't reflect real-time state. If an admin deactivates a user's account, their existing token is still cryptographically valid until expiry. Re-fetching lets us check `isActive` on every request, so a deactivated account is blocked immediately rather than waiting for their token to expire.

**Q: How are passwords stored securely?**
Never in plaintext. `bcryptjs` hashes the password with a salt (12 rounds in this project) before saving — this happens automatically in a Mongoose `pre('save')` hook. Even if the database were leaked, the actual passwords aren't recoverable directly from the hashes.

**Q: What is a salt, and why do we need it?**
A salt is random data mixed into the password before hashing. Without it, two users with the same password would have identical hashes, and attackers could use precomputed "rainbow tables" to crack common passwords quickly. Salting makes every hash unique even for identical passwords.

**Q: How does your "forgot password" flow work securely?**
1. User submits their email.
2. Server generates a random 32-byte token, but stores only its **SHA-256 hash** in the database — never the raw token.
3. The raw token is emailed as a link with a 15-minute expiry.
4. When the user clicks it and submits a new password, the server hashes the submitted token and looks for a matching, non-expired hash in the database.
5. If found, the password is reset and the token is cleared (single-use).

This means even a full database breach can't be used to reset passwords, since the raw tokens were never stored.

**Q: Why does your `forgotPassword` endpoint return the same message whether or not the email exists?**
To prevent "user enumeration" — if the response differed (e.g., "email not found" vs "reset link sent"), an attacker could use this endpoint to check which emails are registered on the platform, which is itself a privacy leak.

**Q: What's the difference between authentication and authorization in your app?**
Authentication (`protect` middleware) answers "who are you" — is this a valid, logged-in user? Authorization (`authorize('admin')`, and the ownership checks in donor/request controllers) answers "are you allowed to do this specific thing" — e.g., only the request's own requester or an admin can cancel it.

---

## 3. Database / Mongoose

**Q: Why MongoDB instead of a relational database like MySQL/PostgreSQL?**
MongoDB's flexible, document-based schema suits this project's nested data well (e.g., a user's `location` object, a request's `hospital` object) without needing separate join tables. It also pairs naturally with JSON, which is what the whole JS stack already speaks.

**Q: What is Mongoose, and why use it instead of the raw MongoDB driver?**
Mongoose is an ODM (Object Data Modeling) library — it adds schema validation, type casting, hooks (like password hashing on save), and instance/static methods to what would otherwise be schema-less MongoDB documents.

**Q: Explain the relationship between User and BloodRequest in your data model.**
`BloodRequest` has `requester` and `donor` fields, both storing a MongoDB ObjectId that references a `User` document (`ref: 'User'`). This is a normalized reference, not embedding — so a `BloodRequest` document doesn't duplicate the user's full profile, just a pointer to it, which `.populate()` can expand when needed.

**Q: What is a 2dsphere index, and why did you use one?**
It's a MongoDB index type built for geospatial queries. Since donors have a `location.coordinates` GeoJSON field, this index enables efficient "find donors near this point" queries using `$near`, instead of scanning every document and calculating distance manually.

**Q: How does your donor search handle both simple filters and geolocation search?**
If `lat`/`lng` query parameters are present, the controller builds a `$near` query against the 2dsphere index, returning donors within a radius sorted by distance. Otherwise, it falls back to a standard filtered query (blood group exact match, city/state case-insensitive regex match) with pagination.

**Q: Why did you make some fields `select: false` in the User schema (like `password`, `resetPasswordToken`)?**
So they're excluded from query results by default — a `GET /api/donors` response, for example, will never accidentally include a password hash. When we specifically need it (like during login), we explicitly `.select('+password')`.

---

## 4. API Design & Validation

**Q: How do you validate incoming request data?**
Using `express-validator` — each route has a validator chain (e.g., `registerValidator`) that checks field presence, format, and constraints (email format, phone digit count, blood group enum, etc.) before the request reaches the controller. A `validate` middleware collects any errors and returns a formatted `400` response if validation fails.

**Q: Why validate on the backend if the frontend already validates form input?**
Frontend validation is for user experience — it can always be bypassed (disabled JS, direct API calls via Postman/curl, a malicious client). Backend validation is the actual security/data-integrity boundary; it must never be skipped.

**Q: How does your app handle errors consistently?**
A custom `ApiError` class carries a status code and message. Controllers `throw` these, and a single global `errorHandler` middleware (registered last in `app.js`) catches everything, formats a consistent JSON response (`{ success, message, errors }`), and only includes stack traces in development mode.

**Q: Explain the blood request status state machine.**
`pending` → `accepted` (only a donor can do this) → `fulfilled` (the assigned donor, requester, or admin can confirm). `cancelled` is reachable from `pending` or `accepted`, but not from `fulfilled` — you can't un-fulfill a request. Each transition checks both the current status and the caller's role/relationship to the request.

---

## 5. Frontend / React

**Q: How is authentication state managed on the frontend?**
A React Context (`AuthContext`) holds the current user and exposes `login`, `register`, `logout` functions. On app load, if a token exists in `localStorage`, it's validated against the backend's `/api/auth/me` before trusting it — this avoids showing a "logged in" UI for an expired/invalid token.

**Q: How do protected routes work?**
A `ProtectedRoute` wrapper component checks `isAuthenticated` from context; if false, it redirects to `/login` (remembering the originally-requested page via router state, so the user lands back where they intended after logging in). `AdminRoute` layers an additional role check on top for admin-only pages.

**Q: Why use Axios interceptors instead of manually attaching the token in every API call?**
DRY (Don't Repeat Yourself) — the request interceptor in `services/api.js` automatically attaches `Authorization: Bearer <token>` to every outgoing call, and the response interceptor globally handles `401` errors by clearing stale session data. Without this, every single API call function would need to duplicate that logic.

**Q: How does Chart.js get its data in the Admin Dashboard?**
The dashboard calls 6 backend aggregation endpoints in parallel via `Promise.all` on mount, then maps the returned arrays into the `{ labels, datasets }` shape Chart.js expects for each chart type (Doughnut, Bar, Line).

---

## 6. Deployment & DevOps

**Q: Where is this app deployed / how would you deploy it?**
Backend on Render (Node web service), frontend on Vercel (static Vite build), MongoDB Atlas as the managed database (already cloud-hosted regardless of where the backend runs). See `DEPLOYMENT.md` for the exact steps.

**Q: Why does the backend need `CLIENT_URL` as an environment variable?**
It's used in the `cors()` middleware to whitelist exactly one origin allowed to call the API, and in the password reset email to build the correct reset link. This needs to change between local development (`http://localhost:5173`) and production (the real deployed frontend URL).

**Q: What happens if you don't restrict CORS?**
Without it, any website could make authenticated requests to your API from a user's browser using their stored cookies/tokens, which is a security risk (in this project, tokens are in `localStorage`, not cookies, which reduces certain CSRF risks — but restricting CORS is still standard practice).

---

## 7. Likely "gotcha" / deeper questions

**Q: What would happen if two people tried to accept the same blood request at the exact same time?**
The `updateRequestStatus` controller checks `request.status !== 'pending'` before allowing an accept. In a very tight race condition, MongoDB's document-level write ordering means only one write actually lands first — the second request would re-read the now-`accepted` status and correctly reject with a 400. (For extremely high-traffic systems, this could be hardened further with an atomic `findOneAndUpdate` with a status-guard condition — worth mentioning as a possible improvement.)

**Q: Your soft-delete uses `isActive: false` — why not just delete the document?**
Preserves data history (which donors previously existed, audit trail) and avoids breaking references — a `BloodRequest` pointing to a deleted donor via `.populate()` would return null and could crash naive frontend code. Soft delete keeps the reference resolvable.

**Q: Why is email sending wrapped in try/catch separately from the rest of the request logic?**
Email delivery is a third-party dependency (SMTP/Gmail) that can fail for reasons outside our control. The core action (creating a request, accepting it) must succeed and be saved regardless of whether the notification email happens to succeed — email is a "nice to have" side effect, not a critical path.

**Q: How would you scale this system for a much larger user base?**
Possible directions: add Redis caching for frequently-read data (donor search results), move to a job queue (e.g., BullMQ) for email sending instead of sending inline during the request, add rate limiting on auth endpoints, paginate more aggressively, and consider read replicas or sharding on MongoDB Atlas for very large datasets.
