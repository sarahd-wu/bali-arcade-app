# BALI - ARCADE | Indoor Mall Map

An interactive indoor mall map built with Next.js, Leaflet, and PostgreSQL.
The existing PostgreSQL database and SQL backup remain the source of truth;
Next.js serves the map and its API.

The map UI and interactions are React client components; Leaflet handles the
floor-plan image and map geometry.

## Requirements

- Node.js 18.18 or newer
- PostgreSQL with PostGIS enabled

## Setup

Install dependencies:

```bash
npm install
```

Create and restore the database if it has not already been set up:

```bash
createdb -U postgres bali_arcade
psql -U postgres -d bali_arcade -f database/bali_arcade.sql
```

Copy `.env.example` to `.env.local` and set the PostgreSQL connection values.
Never commit `.env.local`.

```dotenv
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_NAME=bali_arcade
DB_PORT=5432
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For production, use
`npm run build` followed by `npm start`.

## PostgreSQL API

Next.js Route Handlers provide the existing API paths:

- `GET /api/health`
- `GET /api/floors`
- `GET /api/map/:floor` (GeoJSON; floor `0` is the ground-floor map)
- `GET /api/stores?floor=0`
- `GET /api/stores/:id`
- `PUT /api/stores/:id` (update store name and category)
- `GET /api/search?q=keyword`
- `GET /api/categories`
- `GET /api/stats`

The database pool is server-only and reads `DB_*` values from Next.js
environment configuration. Do not expose database credentials with `NEXT_PUBLIC_`
variables.

## Database backup

Export the current database with:

```bash
pg_dump -U postgres -d bali_arcade -F p -f database/bali_arcade.sql
```
