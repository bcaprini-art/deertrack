# 🦌 DeerTrack

Private land management and deer herd tracking platform for serious hunters.

**"Know your land. Know your herd."**

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Leaflet + Recharts
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Auth**: JWT
- **Deploy**: Railway-ready

## Design

Earthy and modern — deep forest greens, warm cream, amber accents.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
node prisma/seed.js   # loads demo data
npm run dev           # runs on :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # runs on :5173
```

## Demo Account

```
Email: hunter@deertrack.app
Password: Hunt1234!
```

Property: **Brody's Farm** — 320 acres, McLean County, IL  
Includes 4 zones, 3 trail cameras, 5 named bucks, 20 sightings, 5 land improvements, 2 harvests.

## Features

| Feature | Description |
|---|---|
| 🗺️ Property Map | Interactive Leaflet map with zone and camera markers |
| 🦌 Herd Tracking | Buck roster, sighting history, herd health score |
| 📷 Camera Management | Log sightings per camera, track active/inactive |
| 🌱 Land Improvement | Food plots, timber work, soil tests |
| 🏹 Harvests | Harvest log with measurements, linked to bucks |
| 📊 Reports | Recharts visualizations, season trends |

## Herd Health Score (0–100)

Calculated from:
- **Buck:Doe ratio** (40%) — ideal 1:2
- **Body condition** (30%) — avg across sightings
- **Fawn recruitment** (30%) — fawns per doe, ideal 0.6+

## Deploy to Railway

1. Create a Railway project
2. Add a PostgreSQL plugin
3. Set env vars: `DATABASE_URL`, `JWT_SECRET`
4. Deploy backend from `/backend`
5. Deploy frontend from `/frontend` (static Vite build)

Or use `railway.json` in `/backend` for one-click backend deploy.
