# SkillTrack

SkillTrack is a full stack academic and professional companion platform for students and administrators. It combines skill tracking, goals, roadmap planning, and course recommendations with an admin dashboard for managing users and competences.

## Overview

SkillTrack provides:
- Student dashboards with skills, goals, roadmap, and recommendations.
- Admin management for users and competences.
- Secure authentication with role based access.
- A recommendation engine that aligns formations with student objectives.

## Key Features

Student:
- Skill tracking with progress and status
- Academic goals and milestones
- Roadmap planning with progress updates
- Course and formation recommendations tied to goals
- Profile and academic records
- Achievements and activity metrics

Admin:
- System dashboard and statistics
- User management
- Competence management

Platform:
- JWT authentication with HttpOnly cookies
- Role based access control
- REST API with typed models
- Responsive UI

## Architecture and Tech Stack

Frontend:
- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Zustand for state
- Axios for API calls

Backend:
- Node.js, Express, TypeScript
- MongoDB with Mongoose
- JWT auth, bcryptjs, CORS

## Project Layout

```
skill/
├── skilltrack-backend/     Express REST API
├── skilltrack-frontend/    Next.js web app
├── backup_mars_2026/       Sample data backup (optional)
├── verify-setup.sh         Linux or Mac verification
├── verify-setup.bat        Windows verification
└── setup-all.sh            Optional setup helper
```

## Quick Start

Prerequisites:
- Node.js 18+
- MongoDB 6.0+
- npm

1) Backend
```
cd skilltrack-backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

2) Frontend
```
cd ../skilltrack-frontend
npm install
cp .env.example .env.local
npm run dev
```

3) Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

Demo login:
- Email: admin@skilltrack.com
- Password: Admin@123

## Environment Variables

Backend (.env):
```
MONGO_URI=mongodb://localhost:27017/skilltrack_db
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=true
NEXT_PUBLIC_ENABLE_ROADMAP=true
```

## API Summary

Base URL:
- http://localhost:5000/api

Auth:
- POST /auth/login
- POST /auth/register (admin only)
- POST /auth/logout
- GET  /auth/me

Admin:
- GET  /admin/stats

Users (admin only):
- GET    /users
- GET    /users/:id
- PUT    /users/:id
- DELETE /users/:id
- GET    /users/stats/students

Competences:
- GET    /competences
- GET    /competences/:id
- POST   /competences (admin only)
- PUT    /competences/:id (admin only)
- DELETE /competences/:id (admin only)
- GET    /competences/stats/competences (admin only)

Student (student only):
- GET  /student/dashboard
- GET  /student/profile
- PUT  /student/profile
- GET  /student/skills
- POST /student/skills
- GET  /student/academic-records
- POST /student/academic-records/courses
- GET  /student/goals
- POST /student/goals
- PUT  /student/goals/:id
- DELETE /student/goals/:id
- GET  /student/roadmap
- GET  /student/recommendations
- POST /student/recommendations/generate
- POST /student/recommendations/train
- POST /student/recommendations/:id/complete
- POST /student/recommendations/:id/ignore
- GET  /student/achievements

## Data Model Summary

Core collections:
- User (admin and student)
- Competence
- StudentCompetence
- Goal
- Formation
- Filiere
- Achievement
- ActivityProfile

## Recommendation Engine

SkillTrack recommends formations aligned to active student goals. The engine uses a lightweight logistic regression model trained from student feedback (complete or ignore). It scores each recommendation using features such as:
- goalMatch
- missingCoverage
- keywordAffinity
- profileAffinity
- levelFit
- timelineFit

Outputs stored per recommendation:
- aiFeatures: the feature vector used for scoring
- aiProbability: the predicted relevance score

Training can be triggered via:
- POST /student/recommendations/train

## Scripts

Backend:
- npm run dev
- npm run build
- npm run start
- npm run seed
- npm run seed:admin
- npm run typecheck
- npm run lint

Frontend:
- npm run dev
- npm run build
- npm run start
- npm run typecheck
- npm run lint

## Optional Data Restore

A sample MongoDB backup is available under backup_mars_2026/. You can restore it using mongorestore if needed.

## Troubleshooting

- If the frontend cannot call the API, confirm NEXT_PUBLIC_API_URL and CORS_ORIGIN.
- If login fails, run npm run seed or npm run seed:admin to create a demo user.
- If MongoDB is not running, start it with mongod.

## License

ISC
