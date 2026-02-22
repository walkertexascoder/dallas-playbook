# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dallas Playbook is a Next.js app that helps parents find youth sports league registration dates across Dallas-Fort Worth. It combines automated web scraping + Claude AI extraction with an admin approval workflow.

## Commands

```bash
npm run dev              # Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:push          # Push migrations to database
npm run seed             # Seed initial league data
npm run poll             # Verify leagues then scrape for season updates
npm run poll:only        # Scrape without verification step
npm run discover         # Discover new leagues via Serper.dev + Claude
npm run verify           # Verify existing league URLs
```

Scripts run via `tsx` (e.g., `tsx scripts/poll.ts`).

## Architecture

**Next.js 14 App Router** with Turso (cloud SQLite) via Drizzle ORM.

### Data flow
1. **Discovery** (`scripts/discover.ts`): Serper.dev search → Claude evaluates results → URL safety verification → Playwright scrapes page → Claude extracts season JSON
2. **Polling** (`scripts/poll.ts`): Scrapes all active league websites → Claude extracts structured season data → diffs against existing records → inserts/updates
3. **Admin approval** (`/manage`): New leagues/seasons from automated pipelines require admin approval before appearing publicly
4. **Public display**: Calendar view, league directory, age-based filtering

### Database (Drizzle ORM + Turso)
- Schema in `db/schema.ts`, client in `db/index.ts`
- Three tables: `leagues`, `seasons`, `scrape_log`
- Leagues and seasons both have `approved` flags for the admin workflow
- `TURSO_DATABASE_URL` is required; the app will throw if it's missing

### API routes
- `/api/leagues`, `/api/seasons`, `/api/sports` — public read-only endpoints
- `/api/auth/*` — login/logout/check with in-memory session tokens (stored in `globalThis`)
- `/api/manage/*` — protected CRUD endpoints guarded by `lib/require-auth.ts`

### Key libraries
- `lib/claude.ts` — Claude API wrapper: `extractSeasons()`, `extractCityFromPage()`, `evaluateSearchResult()`
- `lib/scraper.ts` — Playwright page scraping
- `lib/verify-url.ts` — URL safety checks (redirects, suspicious content, domain parking)
- `lib/preferences.ts` — Client-side localStorage for hidden seasons and children's birthdates
- `lib/age-utils.ts` — Age group parsing ("5-12", "1st-6th Grade", "14U") and child age matching

### Component patterns
- Server components for data-fetching pages; `"use client"` for interactive components (Calendar, Settings, Admin)
- Client preferences sync across components via custom `"preferences-changed"` events on `window`
- Sport colors in `lib/sport-colors.ts` are designed for colorblind accessibility

## Environment Variables

```
TURSO_DATABASE_URL   # Turso connection URL (omit for local SQLite)
TURSO_AUTH_TOKEN     # Turso auth token
ADMIN_PASSWORD       # Password for /manage admin page
ANTHROPIC_API_KEY    # Claude API (used by extraction scripts)
SERPER_API_KEY       # Serper.dev (used by discover script)
```

## Conventions

- Path alias: `@/*` maps to project root (e.g., `import { db } from "@/db"`)
- Dates stored as ISO strings in the database, not Date objects
- Pages that need fresh data use `export const dynamic = "force-dynamic"`
- Age filtering is fail-open: if an age group can't be parsed, the season is shown
