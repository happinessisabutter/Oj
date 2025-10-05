# SQLite Support & Postgres Cleanup (2025-01-27)

## Code
- Consolidated to a single dynamic DataSource: `backend/src/libs/data-source.ts` (switches between Postgres and SQLite via `DB_TYPE`).
- Updated `backend/src/scripts/seed-sqlite-users.ts` to use the unified DataSource (sets `DB_TYPE=sqlite` programmatically).
- Added `backend/src/scripts/cleanup-postgres.ts` to truncate `users` and `sessions` in Postgres after repeated seed runs.
- Updated `backend/package.json` scripts (`seed:sqlite`, `db:clean`) and dependencies (`sqlite3`).

## Docs
- Expanded `backend/src/libs/DATASOURCE_GUIDE.md` with SQLite workflow guidance, dynamic DataSource usage, and Postgres cleanup steps.

## Follow-up
- Run `npm install` inside `backend/` to ensure `sqlite3` is installed if dependencies are managed locally.
