# Empreinte

**Precision trust operating layer for premium membership operations.**

Empreinte vets members, governs who gets through the door, logs every decision in an immutable trail, and surfaces the revenue your suites are leaving on the table. Built for ARENA's premium suite membership operation.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## What's inside

| Module | Route | What it does |
| --- | --- | --- |
| **Command Center** | `/admin` | Trust-health index, live anomaly feed, KPIs at a glance |
| **Review Queue** | `/admin/applications` | Applicant vetting with risk scoring — approve, waitlist, request info, reject |
| **Members** | `/admin/members` | Roster with per-member dossiers: identity intelligence, anomalies, bookings, audit trail |
| **Access & Guests** | `/admin/access` | Live credential posture, guest vetting, watchlist / restrict / reinstate |
| **Suites & Game-Day** | `/admin/suites` | Suite inventory, occupancy, fixture schedule with guest lists |
| **Member Graph** | `/admin/graph` | Trust & referral topology — flags circular-vouching rings |
| **Revenue Intel** | `/admin/revenue` | Revenue gaps computed from live data, plus optional Claude-powered analysis |
| **Audit Log** | `/admin/audit` | Hash-chained, append-only record of every operator decision |
| **Security** | `/admin/settings` | Role-based access control and security posture |

The landing page (`/`) doubles as the member portal: switch the demo role to **Member** and it becomes a self-service dashboard with suite booking.

## The intelligence layer

`src/lib/services/intelligence-service.ts` powers identity vetting:

- **Identity signals** — device fingerprints, network topology, duplicate-document detection
- **Image forensics** — synthetic-face (StyleGAN) scoring, reverse-image matching
- **Access anomalies** — concurrent-use, off-hours, guest spikes, credential sharing
- **Graph analysis** — circular vouching / manufactured-trust rings

Every signal carries confidence, impact, reasoning, and provenance, and renders in the member dossier.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All data is seeded in-memory (`src/lib/services/seed-data.ts`) — no database required. Actions (restrict, approve, vet) mutate live state and write to the audit log for the session.

### Optional: live AI revenue analysis

The **Run live AI analysis** button on `/admin/revenue` calls Claude to surface non-obvious revenue opportunities from the operating data.

```bash
cp .env.example .env.local
# then add your Anthropic API key to .env.local
```

Without the key everything else works; the button surfaces a clear error instead.

## Roles

The demo auth (`src/hooks/use-auth.tsx`) supports five roles with scoped navigation: **Admin**, **Membership Director**, **Front Desk**, **Auditor**, and **Member**. Switch roles from the user menu in the sidebar.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Radix UI · Recharts · react-force-graph · Framer Motion
