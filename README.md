# DeciSmart

DeciSmart is an AI-powered decision support platform designed to help teams and individual users evaluate alternatives, compare criteria, and document decisions with a structured workflow.

The repository is organized as a two-tier application:

- `frontend`: Next.js application for the user interface and dashboard experience.
- `backend`: Express.js API for authentication, decision processing, history, analysis, and admin workflows.

## Repository Structure

```text
DeciSmart/
  backend/
    config/
    controllers/
    database/
    middleware/
    routes/
    scripts/
    services/
    utils/
    validators/
  frontend/
    src/
      app/
      components/
      hooks/
      lib/
      styles/
  vercel.json
```

## What It Covers

- Decision creation and management
- Alternative comparison and scoring
- Criteria-based analysis
- AI-assisted recommendations
- Decision history and reporting
- Admin pages for operational oversight
- Supabase-backed authentication and data storage

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- A Groq API key

### 1. Install dependencies

From the repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create or update `backend/.env` with the values required by the API.

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=1h
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

If the frontend needs additional runtime variables, keep them in the frontend environment file used by your deployment or local setup.

### 3. Start the applications

Run the API first, then the web app.

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## Available Scripts

### Backend

- `npm run dev` - start the API in development mode with nodemon
- `npm run start` - start the API in production mode
- `npm run seed` - load seed data into the database

### Frontend

- `npm run dev` - start the Next.js development server
- `npm run build` - build the frontend for production
- `npm run start` - start the production frontend server
- `npm run lint` - run Next.js lint checks

## Deployment Notes

The project is prepared for Vercel deployment. The current `vercel.json` maps:

- `frontend` to the root route
- `backend` to `/_/backend`

Make sure the deployed environment includes the same API and Supabase variables used locally.

## Operational Notes

- The backend exposes a health check at `/health`.
- The API root returns a short endpoint summary at `/api`.
- Keep Supabase credentials and JWT secrets out of source control.
- If you change the schema or RLS policies, review the SQL files in `backend/database/` before deploying.

## Support

For new contributors, the recommended path is to review the app flow in the frontend dashboard and the API routes in `backend/routes/` before making changes. That gives a clear view of how the decision workflow moves through the system.