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
| **Books & Tax** | `/admin/books` | P&L, categorised expense ledger, review flags, quarterly view, accountant CSV pack |
| **Audit Log** | `/admin/audit` | Hash-chained, append-only record of every operator decision |
| **Security** | `/admin/settings` | Role-based access control and security posture |

## How members join

ARENA is vetted, so the flow is **apply → vet → approve → pay → access**: no card is collected until identity review clears. The landing page carries the tier pricing and a live application form — submissions are risk-scored on arrival (disposable-email detection, referral provenance) and land straight in the Review Queue, audited as `APPLICATION_RECEIVED`.

Pricing lives in one place: the `TIERS` array in `src/components/public/apply-dialog.tsx`. Edit those numbers and the pricing cards, apply dialog, and payment step all update.

## Books & Tax

`/admin/books` keeps the year in order so tax time is a handover, not a scramble:

- **P&L** built from live data — dues by tier, suite bookings, guest passes, against expenses grouped into the categories a business return asks for.
- **Ledger** where every line carries a category, a deductible rate, a payment method, and whether a receipt is on file.
- **Needs review** surfaces lines whose treatment is a judgement call (meals limited to 50%, capital purchases that might qualify for first-year expensing, anything unreceipted) with the actual question to put to your accountant.
- **Quarterly** view with a suggested set-aside and the usual estimated-payment dates.
- **Accountant pack** exports the P&L and the full ledger as CSV.

**This organises records; it does not file returns or give tax advice.** Deductible rates are common defaults, and the set-aside is a flat placeholder — real liability depends on entity type, state, credits, and prior-year positions. Everything here is built to hand to a licensed professional, not to replace one.

## Persistence

State is seeded from `src/lib/services/seed-data.ts` and persisted two ways:

1. **Server-side**, through `/api/state` (GET/PUT/DELETE). The storage backend is resolved in `src/lib/server/store.ts` — set `KV_REST_API_URL` and `KV_REST_API_TOKEN` (Vercel KV / Upstash Redis) and the session persists across devices and deploys. With no store configured it falls back to process memory.
2. **`localStorage`**, as an offline mirror, so the app still works with no backend at all.

`SESSION_VERSION` in the data provider retires stale sessions, so shipped seed changes reach people who already have one saved. **Reset demo data** in the user menu clears both layers.

To swap in Postgres or anything else, implement the `Store` interface in `src/lib/server/store.ts` — nothing else changes.

## Payments

Approving an application issues an invoice and a payment link (`/checkout?t=…`) — no card is ever collected during vetting. The checkout page is a working invoice with a simulated payment step; **no charge is made and no card details are taken**.

To make it real, replace the `pay()` handler in `src/app/checkout/page.tsx` with a call to a server route that creates a Stripe Checkout Session, and have Stripe's webhook call `markInvoicePaid`. Pricing comes from the same `TIERS` constant the pricing page uses.

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

## Alerts

High-severity anomalies and door overrides raise an in-app toast while you work, wherever you are in the console. Slack relay channels are documented in the Inbox and activate with `SLACK_WEBHOOK_URL`.

## Mobile

The console is responsive: below `lg` the sidebar collapses into a hamburger drawer with a top bar carrying search and your account. The Door Console in particular is built to be usable on a tablet at the gate.

## Keyboard

**⌘K / Ctrl-K** opens the command palette anywhere in the console — jump to any page, member, or applicant. Arrow keys navigate, ↵ opens, esc closes.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Radix UI · Recharts · react-force-graph · Framer Motion
