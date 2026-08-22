# Empreinte

**Precision trust operating layer for premium membership operations.**

Empreinte vets members, governs who gets through the door, logs every decision in an immutable trail, and surfaces the revenue your suites are leaving on the table. Built for ARENA, where a membership buys access to private suites at sporting events and concerts.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## What's inside

| Module | Route | What it does |
| --- | --- | --- |
| **Command Center** | `/admin` | Role-aware home: live KPIs, anomaly feed, recent decisions, CSV export |
| **Door Console** | `/admin/door` | The front desk: look someone up, get a decision with its reason, admit/deny/override |
| **Review Queue** | `/admin/applications` | Applicant vetting with risk scoring — approve, waitlist, request info, reject |
| **Inbox** | `/admin/inbox` | Member & guest threads tied to identity — live trust score in the header, replies audited |
| **Members** | `/admin/members` | Roster with per-member dossiers: identity intelligence, anomalies, bookings, audit trail |
| **Access & Guests** | `/admin/access` | Live credential posture, guest vetting, watchlist / restrict / reinstate |
| **Suites & Game-Day** | `/admin/suites` | Suite inventory, occupancy, fixture schedule with guest lists |
| **Member Graph** | `/admin/graph` | Trust & referral topology — flags circular-vouching rings |
| **Revenue Intel** | `/admin/revenue` | Revenue gaps from live data, Claude-powered analysis, and the founder-only Moonshot Vault |
| **Audit Log** | `/admin/audit` | Hash-chained, append-only record of every operator decision |
| **Security** | `/admin/settings` | Role-based access control and security posture |

## How members join

ARENA is vetted, so the flow is **apply → vet → approve → pay → access**: no card is collected until identity review clears. The landing page carries the tier pricing and a live application form — submissions are risk-scored on arrival (disposable-email detection, referral provenance) and land straight in the Review Queue, audited as `APPLICATION_RECEIVED`.

Pricing lives in one place: the `TIERS` array in `src/components/public/apply-dialog.tsx`. Edit those numbers and the pricing cards, apply dialog, and payment step all update.

## Session persistence

There is no backend. State is seeded from `src/lib/services/seed-data.ts` and persisted to `localStorage` under `empreinte_session_v1`, so an application you submit survives a refresh. **Reset demo data** in the sidebar user menu restores the seed.

## The landing page

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

## Guided tour

Every admin page carries a **Tour** button (bottom-right). It spotlights each sidebar tab in turn with a written explanation of what it does, navigating the page as it goes. Arrow keys or the on-screen arrows step through it; steps are filtered to the signed-in role. It opens itself once on a first visit.

## Roles — each desk gets its own console

Roles are not just a nav filter; they change where you land and what exists.

| Role | Lands on | Sees |
| --- | --- | --- |
| **Admin** (Kevin Balfe, CEO) | Command Center | Everything, including the Moonshot Vault |
| **Membership Director** | Command Center | Vetting, members, access, revenue — no security settings |
| **Front Desk** | **Door Console** | Door, members, inbox, access, suites — no revenue, audit, or graph |
| **Auditor** | Command Center | Read-only oversight and the immutable record |
| **Member** | Member portal | Their own bookings, guest credits, and suite reservations |

Switch roles from the user menu in the sidebar.

## Keyboard

**⌘K / Ctrl-K** opens the command palette anywhere in the console — jump to any page, member, or applicant. Arrow keys navigate, ↵ opens, esc closes.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Radix UI · Recharts · react-force-graph · Framer Motion
