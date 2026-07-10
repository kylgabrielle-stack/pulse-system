# PULSE+ — Population Update and Linking for Sustainable Empowerment

*"Empowering Communities through Population Insights."*

A monitoring and information system for the Provincial Population Office (OPPO) that
replaces the manual, paper-based RPFP documentation process. Staff encode data once,
track approval status in real time, and the system auto-consolidates approved records
into the monthly summary report for POPCOM Region 4A — no manual re-tallying.

This implements **Phase 1 scope: RPFP only**, per the System Requirements document.

---

## What's included

- **Role-based login** — Technical Section Staff, Technical Section Head, Provincial
  Population Officer, Admin. Each role only sees/does what's relevant to it.
- **Dashboard** — total/pending/for-review/for-approval/approved counts, broken down
  per municipality.
- **RPFP Records list** and **Documentation Report list** — filters (municipality,
  barangay, date, status) + search, "Open Details" pattern.
- **RPFP Form 1 entry** and **Documentation Report entry** forms, matching every field
  and dropdown in the spec, including the POPCOM code legend (civil status, education,
  FP methods, traditional FP type, non-modern status, reason for using).
- **Record details page** with full approval history/audit trail.
- **Review & Approval** — Section Head and Population Officer each get a queue,
  approve/reject with a required remarks field on rejection.
- **Monthly Summary** — auto-generated (not manually entered) from **Approved** records
  only, grouped by municipality/barangay, with a **PDF export** button.
- **Admin / Reference Data** — manage barangay list, personnel list, FP method codes,
  and user accounts.

## Stack & why

- **Backend:** Node.js + Express. Data is stored in a single `database.json` file
  (a small custom datastore in `backend/db.js`) instead of SQLite/Postgres, so the
  whole thing runs with a plain `npm install` — no native build toolchain (Python/
  make/g++) required. This matters if you're running it on a shared office PC. Swap
  `db.js` for a real database later without touching the route files — they only call
  the functions it exports.
- **Frontend:** React (Vite) + React Router, plain CSS (no UI framework dependency).
- **PDF export:** `pdfkit` (pure JS, no native deps).
- **Auth:** JWT + bcrypt password hashing.

## Project structure

```
pulse-plus/
  backend/
    server.js            Express app entrypoint
    db.js                 JSON file datastore + seed data
    constants.js           Fixed POPCOM code legend (civil status, education, etc.)
    middleware/auth.js     JWT verification + role guard
    routes/                auth, constants, admin, doc-reports, rpfp, reviews, dashboard, summary
    utils/pdf.js            Monthly summary PDF renderer
  frontend/
    src/
      pages/                One file per screen (Login, Dashboard, lists, forms, etc.)
      components/           Navbar, Sidebar, StatusBadge, ProtectedRoute
      context/AuthContext.jsx
      api.js                 fetch wrapper with JWT bearer token
      styles.css
```

## Running it locally

Requires Node.js 18+.

### 1. Backend

```
cd backend
npm install
npm run dev
```

Starts the API on `http://localhost:4000`. On first run it creates `database.json`
seeded with sample barangays/personnel/FP methods and four demo accounts.

### 2. Frontend

In a second terminal:

```
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` and proxies `/api` calls to the backend.

### Demo accounts (seeded)

| Username     | Password    | Role                          |
|--------------|-------------|-------------------------------|
| `admin`      | `admin123`  | Admin                         |
| `staff`      | `staff123`  | Technical Section Staff       |
| `sectionhead`| `head123`   | Technical Section Head        |
| `popofficer` | `officer123`| Provincial Population Officer |

**Change these before using the system with real data.**

### One-port production build (optional)

```
cd frontend && npm run build
cd ../backend && npm start
```

`server.js` serves the built frontend from `frontend/dist`, so the whole app runs
from `http://localhost:4000` alone.

## Status workflow

```
Pending → For Review (Section Head) → For Approval (Population Officer) → Approved
                     ↑                              ↑
                     └──────── Reject (remarks) ─────┘  (sends back to Pending)
```

Note: the spec's status chain lists `Reviewed` as a distinct step between `For Review`
and `For Approval`. In this implementation the Section Head's approval **immediately**
forwards the record into the Population Officer's queue (status jumps straight to
`For Approval`), since nothing in the process actually acts on a record while it's
sitting at "Reviewed" — there's no separate human step for it. The `Reviewed` action
is still written to the audit trail (visible on each record's Details page) so nothing
is lost for reporting purposes. If your adviser wants `Reviewed` as its own visible
status/queue instead, that's a small change in `backend/routes/reviews.js`.

## Open items still to confirm (from spec section 9)

These are flagged in the requirements doc as unresolved — the system doesn't assume
answers for you:

- **Excel export** alongside PDF — not built. The summary PDF (`GET /api/summary/pdf`)
  is implemented; an Excel export can be added the same way once confirmed.
- **Physical/paper copy retention** — no effect on the system either way; it's a
  process question outside the system's scope.
- **Admin vs. Population Officer** — implemented as separate roles/accounts, since the
  spec's role table lists them separately. One person can simply be given both a
  `population_officer` and an `admin` account if the office decides to merge them.
- **AHD / GAD (Phase 2)** — not built. The data model (barangay/personnel/FP method
  reference tables, the review-and-approval pipeline, dashboard, summary generator)
  is written generically enough that adding AHD/GAD would mean new form pages + new
  route files following the same pattern as `docreports.js`/`rpfp.js`, not a rewrite.

## Assumptions made to fill gaps in the spec

- **Monthly summary table format**: the spec says this is auto-generated but doesn't
  give an exact column layout for POPCOM's format. I grouped by Municipality/Barangay
  with participant totals, sex breakdown, and modern/traditional FP method counts for
  RPFP, and seminar counts + participant totals for Documentation Reports. Adjust
  `buildSummary()` in `backend/routes/summary.js` once you have the exact POPCOM
  template.
- **Participant's Signature Consent**: implemented as a checkbox + server-side
  timestamp, per the spec's own recommendation ("consent checkbox with timestamp...
  unless a signature pad is available").
- **"Address / Household ID Number"** was listed as one field in the spec's table but
  described as two distinct pieces of data — split into two separate fields
  (`address`, `householdId`) since that's clearly the intent.
