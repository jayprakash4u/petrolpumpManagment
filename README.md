# Fuel Station Manager

A production-shaped fuel station management system: multi-role staff login, live tank stock, sales billing, credit customer accounts, and reporting. Next.js 16 (App Router, Server Actions), Prisma, TypeScript strict.

> **Status:** the full roadmap is built — foundation, Dashboard, **Sales Entry**, **Tank & Stock**, **Employees**, **Credit Customers**, and **Reports** all run end-to-end against a real database, with 417 passing tests over the money, stock, tenancy, date and access-control logic. Dates are **Bikram Sambat** throughout — see [Dates](#dates-bikram-sambat). **Multi-tenant** (one pump = one tenant) — see [Multi-tenancy](#multi-tenancy). Only CI setup remains — see [Roadmap](#roadmap).

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components + Server Actions give one deployable with no separate API layer |
| Database | Prisma ORM, SQLite (dev) | Zero-setup local dev; schema is provider-portable — see [Switching databases](#switching-databases) |
| Auth | Hand-rolled: `jose` (JWT) + `bcryptjs` + DB-backed sessions | Follows Next.js's own recommended auth pattern exactly (see `node_modules/next/dist/docs/01-app/02-guides/authentication.md`); avoids an extra dependency whose Next-16 compatibility wasn't verifiable at build time |
| Validation | Zod | Server-side validation on every mutation; never trust client input |
| Money/volume | Prisma `Decimal` end-to-end | No float drift in totals — see `src/lib/money.ts` |
| Styling | Tailwind CSS v4 | Design tokens in `src/app/globals.css` |
| Charts | Recharts | |

## Getting started

```bash
npm install
cp .env.example .env        # then set SESSION_SECRET (see comment in the file)
npm run db:push             # creates prisma/dev.db from the schema
npm run db:seed             # demo station, tanks, staff logins, sample sales
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`. Sign in with **station code `shree-petroleum`** and a **username** (password `password123` for all):

| Role | Username |
|---|---|
| Owner | `prakash` |
| Manager | `anita` |
| Cashier | `sita` |
| Attendant | `ramesh` |

Then open http://localhost:3000/admin for the **platform console** (operator sign-in, no station code):

| | |
|---|---|
| Username | `operator` |
| Password | `password123` |

## Architecture notes

- **Auth**: the proxy's cookie check is *signature-only* and deliberately never redirects away from `/login` — the database is the authority, and letting an optimistic check bounce users off the login page caused an infinite redirect loop for anyone whose session had been revoked server-side (pinned by `src/proxy.test.ts`). `src/lib/session.ts` issues a signed JWT cookie that only *names* a `Session` row in the database — the row is the source of truth, so revoking a session (logout, deactivating a user) takes effect immediately rather than waiting out the token's TTL. `src/proxy.ts` does a fast, cookie-only *optimistic* redirect (Next 16 renamed Middleware to Proxy); the actual security boundary is `src/lib/dal.ts`'s `requireUser()`, called in every protected layout/action, which checks the database.
- **Authorization**: `src/lib/permissions.ts` is the single source of role→capability truth. UI reads it to decide what to render; every Server Action re-checks it against the server-verified session role, per Next.js's own guidance that Server Actions are public endpoints and must not trust the client.
- **Money**: every currency/volume column is Prisma `Decimal`, and arithmetic uses `Prisma.Decimal` (`src/lib/money.ts`) end to end — never native `number` — so a sale total can't drift by float rounding.
- **Data layer**: `src/lib/queries/*` do the aggregation in SQL/Prisma (groupBy, sums) rather than pulling full tables into JS, so dashboard/report pages stay fast as data grows.

## Dates: Bikram Sambat

Nepal runs on BS, not Gregorian. VAT periods, IRD filings, price notifications and every pump's own books are dated in BS, so **BS is the display and reporting calendar throughout the app** — an owner shown "19 Aug 2026" instead of "2083-05-03" reads the software as foreign and unusable.

**Storage does not change.** Every timestamp stays a real UTC instant in the database. BS is a presentation and range-selection concern only; storing BS strings would break sorting, comparison and arithmetic, and would be near-impossible to migrate off.

`src/lib/bs-date.ts` is the **only** module that touches the conversion library, so the dependency stays swappable. It provides `toBS` / `fromBS`, the `fmtBS*` formatters, BS month ranges, and Nepal's fiscal year (which opens on **Shrawan 1**, so BS months 1–3 belong to the fiscal year that started the *previous* BS year — get that backwards and a quarter of every year's VAT is misfiled).

**Two things it guards against:**

- **The library returns silent nonsense below its table instead of throwing.** `1900-01-01 AD` comes back as `2043-04-08 BS`, which converts forward again to `1986-07-23` — adrift by 86 years, with no error. Every conversion here is therefore verified by converting straight back and comparing; a mismatch returns `null`. A silent 86-year error in a VAT filing is exactly what this module exists to prevent.
- **Out of range never crashes a page.** Conversions return `null` and formatters fall back to the Gregorian date, so a stray year looks visibly odd rather than taking down a report.

"This month" means the **BS** month. On 2083-05-03 that is Bhadra 1–3 (three days), not the nineteen days of Gregorian August — a Gregorian boundary would split a pump's books across two BS months.

**Still Gregorian, and deliberately flagged:** the custom date-range inputs on `/reports` are still native `<input type="date">` pickers. They work, but a Nepali user wants to pick *Bhadra 1*, not *17 August*. A proper BS date-picker component is the next piece of this work.

## Multi-tenancy

**One petrol pump is one tenant.** `Station` is the tenant root, and every table that holds business data carries a `stationId` (directly, or one relation away). Every query and every Server Action is scoped by the `stationId` on the *server-verified session* — never by anything the client sends.

**Identity is `(station code, username)`, not email.** Staff sign in with a username, because at a petrol pump most attendants have no work email at all — inventing one just to satisfy a login form produces addresses nobody reads and nobody can recover a password through. `Station.slug` is the tenant's public handle (`shree-petroleum`); `User.username` is unique **per station** (`@@unique([stationId, username])`), never globally. That buys two things:

- The same person can hold an account at more than one pump.
- No pump can discover anything about another. A global unique would let one owner watch for "already exists" errors to probe whether a username is taken elsewhere; scoping it removes the channel entirely.

Login failures return **one identical message** for an unknown station code, unknown username, wrong password, suspended tenant, and deactivated account — otherwise the differences let anyone enumerate which stations exist and who works at them. A miss still runs a bcrypt comparison against a dummy hash so the response time doesn't leak the answer either. Rate limiting is keyed per `(ip, station, username)`, so attacking one pump can't lock out another's staff.

Tenants can hand staff a bookmark like `/login?station=shree-petroleum` to prefill the code; it is only a convenience, and the login still verifies all three fields as one unit.

### The platform console

`/admin` is the operator console — where *you* onboard and manage pumps. It is a **separate privilege plane**, not a bigger role list, and the distinction is the whole security design:

| | Tenant plane | Platform plane |
|---|---|---|
| Table | `User` | `PlatformAdmin` |
| Sessions | `Session` | `PlatformSession` |
| Cookie | `fsm_session` | `fsm_admin_session`, scoped to `/admin` |
| JWT claim | `sid` | `psid` |
| Login | station code + username | username only |
| Audit | `AuditLog` (per tenant) | `PlatformAuditLog` |

**Why not a `SUPERADMIN` role?** Because `changeUserRoleAction` lets a station owner assign any value in the `Role` enum. Add platform access to that enum and any pump owner could promote themselves to read every other pump's books. There is no code path between `PlatformAdmin` and `User`, so that escalation cannot be expressed at all — and a test asserts the `Role` enum still contains exactly the four tenant roles.

The console deliberately shows **tenant metadata only** — name, code, staff count, sale count, join date, last activity. No revenue, no stock, no customer balances. Running the platform doesn't require reading anyone's books, and keeping it that way means an operator compromise leaks far less. There is no impersonation.

**Suspending a tenant** revokes every live session immediately, closes any open shift, and blocks new logins — which fail with the *same* message as a station that never existed, so nobody outside learns that a pump exists but is in arrears. Suspension withdraws access; it never deletes the tenant's records.

**Isolation is enforced by discipline, and pinned by tests.** `src/lib/actions/tenancy.integration.test.ts` builds *two complete stations* with deliberately colliding data — the same staff username, the same customer name, the same receipt numbers — and asserts that every read path and every write path stays inside its own tenant. Removing a single `stationId` from any query fails it. Read that suite before adding a new query.

## Switching databases

The schema currently targets SQLite for zero-friction local dev. For production:

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"` (recommended) in the `datasource` block.
2. Optionally re-add explicit precision to the `Decimal` fields, e.g. `ratePerL Decimal @db.Decimal(10, 2)` (SQLite doesn't support native decimal typing, which is why those annotations were stripped for now).
3. Point `DATABASE_URL` at a real Postgres instance (e.g. [Neon](https://neon.com), Railway, or your own).
4. `npm run db:push` (or switch to proper migrations with `prisma migrate dev` once the schema has stabilized).

A `docker-compose.yml` is included for running Postgres locally if you'd rather not use a hosted free tier.

## Known trade-offs (read before deploying for real)

- **Login rate limiting is in-memory** (`src/lib/rate-limit.ts`) — resets on restart and isn't shared across instances. Fine for a single-server deploy; swap for Redis/Upstash if you scale horizontally.
- **`prisma`/`@prisma/config` (dev-only CLI tooling) carries a known high-severity advisory** in its `effect` dependency at the time of writing. It affects the CLI, not the `@prisma/client` runtime bundled into the deployed app. Tracked upstream; re-run `npm audit` before shipping.
- **The Dashboard slice has no tests of its own** — it's read-only presentation. Tests cover the modules that mutate data (see [Testing](#testing)).
- **Tenant isolation is a convention, not a database rule.** Every query today remembers `stationId` because it was written that way, and `tenancy.integration.test.ts` fails if one forgets — but nothing at the database level stops a future query from omitting it. Before this carries many pumps' real money, add a structural guard: a Prisma client extension that injects the tenant filter, or Postgres row-level security.
- **SQLite is single-writer.** Fine for one pump on one box, wrong for many tenants — move to Postgres before real traffic.
- **Concurrency is enforced with guarded writes, not row locks.** SQLite serializes writers, so the conditional `updateMany` predicates are belt-and-braces there; on Postgres they're what actually prevents a double-sale from overselling a tank. If you later add a path that adjusts `Tank.levelL` or `Customer.dueAmount` outside these actions, it must use the same pattern or add `SELECT … FOR UPDATE`.

## Roadmap

The database schema and permission model already cover the full app (see `prisma/schema.prisma`, `src/lib/permissions.ts`); these are UI + Server Action work, not redesign:

1. ~~**Sales Entry**~~ — **done.** See [Sales Entry](#sales-entry) below.
2. ~~**Tank & Stock**~~ — **done.** See [Tank & Stock](#tank--stock) below.
3. ~~**Employees**~~ — **done.** See [Employees](#employees) below.
4. ~~**Credit Customers**~~ — **done.** See [Credit Customers](#credit-customers) below.
5. ~~**Reports**~~ — **done.** See [Reports](#reports) below.
6. CI (lint + typecheck + test + build) on push.
7. ~~**Tenant onboarding**~~ — **done** via the platform console at `/admin`. Self-serve signup (a pump onboarding itself, without an operator) is still open.
8. **Per-tenant branding** — the station name is hardcoded in `src/components/shell/Sidebar.tsx` and the page title; every tenant currently sees "Shree Petroleum".
9. **Postgres + a structural isolation guard** — see [Known trade-offs](#known-trade-offs-read-before-deploying-for-real).

## Sales Entry

`/sales` is the transactional core. A sale is one database transaction that either commits completely or leaves nothing behind — no stock moved, no receipt number consumed, no credit charged.

**Entry.** Operators key in either litres (`40`) or a rupee amount (`Rs 500 of petrol`) — both are how a pump actually gets used. Litres are always the stored source of truth, and `totalAmount` is always exactly `liters × ratePerL` rounded to 2dp, never the raw figure typed in. That invariant is what lets reports re-derive revenue from volume without the two disagreeing. In amount mode litres round **down**, so a customer paying Rs 500 never receives more fuel than their money covers.

**What the transaction guarantees:**

| Risk | How it's prevented |
|---|---|
| Two pumps sell the last of a tank at once | Stock is deducted with a conditional `updateMany` (`levelL >= liters`) — the check and the decrement are one atomic statement, so the level can never go negative |
| A manager changes the pump rate mid-sale | The form pins the rate it displayed; the action refuses if the tank's rate has moved, rather than billing a price nobody agreed to |
| A credit customer is pushed past their limit on a stale read | The balance is updated by compare-and-swap against the value just read; a concurrent charge aborts the sale instead of overshooting |
| Duplicate or skipped receipt numbers | `Station.nextReceiptNo` is minted by atomic increment inside the transaction |
| A void refunds the same fuel twice | The `voided` flag flips via a guarded update — first writer wins, a double-click is a no-op |
| A user touching another station's data | Every lookup is scoped by `stationId` from the server-verified session, never from the form |

Voiding is owner/manager only, requires a written reason, returns the fuel to the tank, and reverses any credit charge (clamped at zero, in case a payment already cleared the balance). Both recording and voiding write to `AuditLog`.

## Tank & Stock

`/stock` is the other side of the ledger: sales take fuel out, this puts it back in and reprices what's there. Both operations are single transactions, owner/manager only.

**Deliveries** add fuel against a supplier invoice. Cost per litre and margin against the current pump rate are *derived*, never stored, so they can't drift from the invoice total — and a delivery priced above the pump rate is flagged as selling at a loss before it's saved.

**Rate changes** write a `FuelRateHistory` row every time, so "why was receipt #412 billed at Rs 104.20?" is always answerable. Repricing never touches sales that already happened — each sale snapshots its own `ratePerL`.

**What the transactions guarantee:**

| Risk | How it's prevented |
|---|---|
| A delivery overfills a tank | Capacity check and the increment are one conditional `updateMany` (`levelL <= capacity − liters`) — the mirror image of the sale's stock guard |
| Two managers reprice the same fuel at once | Compare-and-swap on `ratePerL`; the second save is refused rather than silently clobbering the first |
| A slipped decimal point turns Rs 106.48 into Rs 10648 | Rates are range-checked, and any move of ±20% or more requires explicit confirmation — enforced **server-side**, so omitting the checkbox in a forged request still fails |
| A no-op "change" polluting the rate history | An unchanged rate is rejected before any row is written |
| A delivery quietly draining a tank | Negative volumes and negative invoice totals are rejected |
| Touching another station's tanks | Every lookup is scoped by `stationId` from the server-verified session |

## Employees

`/employees` covers who works here, who's on the floor right now, and how each of them is selling.

**Shifts.** Anyone can clock themselves on and off; owners and managers can do it for someone else, and the log records which. The `Shift` row and the `User.onShift` flag are written in one transaction, and the flag flips via a guarded update — so a double-click can't open two overlapping shifts. If the two ever *do* fall out of step (a crash between writes), ending a shift still works and closes the flag, logging `orphanedFlag` rather than stranding someone "on shift" forever with no way back.

**Performance** is aggregated in SQL with `groupBy` over a Today / 7-day / 30-day window, chosen by a plain link-driven search param rather than client state. Per-head revenue, volume, sale count, average sale, and share of station takings — visible to owners and managers only. An attendant sees the roster and their own shift button, and no figures at all.

**Accounts** (owner only) — add an employee, change a role, deactivate or reactivate. Beyond the roadmap's "shift start/end, per-staff performance", but it's what activates the `manageUsers` permission and the session-revocation machinery that were already built and otherwise dead.

| Risk | How it's prevented |
|---|---|
| An owner locks themselves out | Self-deactivation and self-demotion are both refused |
| The station is left with nobody who can manage users | Removing or demoting the last **active** owner is refused |
| A sacked employee keeps working until their token expires | Deactivation revokes every live `Session` row, so it takes effect on their next request |
| A demoted employee keeps their old powers | A role change also revokes their sessions — they sign back in with the new capabilities |
| A deactivated employee leaves a shift open forever | Deactivation closes any open shift in the same transaction |
| Two accounts for `Ram@x.com` and `ram@x.com` | Emails are stored lowercased, matching what login looks up |
| A password leaking through the audit trail | `USER_CREATED` records name, email, and role — never the password or its hash (there's a test asserting exactly this) |

Employees are never deleted: `Sale`, `Purchase`, and `AuditLog` all reference them with `onDelete: Restrict`, because the history has to stay attributable.

## Credit Customers

`/credit` closes the loop on credit sales: until now `dueAmount` only ever grew. Accounts list by balance, selecting one shows its ledger and payment panel.

**Overpayment is refused, not trimmed.** This is the specific bug the original prototype had: it accepted Rs 5,000 against a Rs 3,000 debt and quietly recorded Rs 3,000. The customer's receipt and the station's books then disagreed by Rs 2,000 with nothing on either side to explain it. Refusing forces the operator to look at the real balance — anything genuinely extra goes through as a cash sale, where it belongs.

**The ledger is a merged stream** of credit sales and payments in one chronological list, because "what happened on this account" is a single story. The `CustomerPayment` row and the `dueAmount` decrement are written in one transaction, so the ledger always reconciles to the balance.

| Risk | How it's prevented |
|---|---|
| Overpayment silently vanishing | Refused outright, with the exact outstanding balance in the message |
| Paying against a balance that moved | The form pins the balance it displayed; a credit sale landing in between makes the action refuse |
| A concurrent sale being wiped by a stale payment | Compare-and-swap on `dueAmount` — the second writer aborts rather than overwriting |
| A debt disappearing from view | Closing an account with money outstanding is refused |
| A cashier quietly raising a credit line | Limit changes need `viewReports` (owner/manager) — deliberately narrower than taking payment |
| Duplicate accounts for the same firm | A same-named active account at the same station is refused |
| Touching another station's accounts | Every lookup scoped by `stationId` from the server-verified session |

Cutting a limit *below* an existing balance is allowed and warned about — the debt stands, the customer simply can't borrow more.

## Reports

`/reports` is owner/manager only — and the nav hides it from everyone else, though the page refuses on its own regardless, since hiding a link is never the control.

**Ranges are URLs.** Presets are plain links and the custom range is a GET form, so every report is a real shareable address — a manager can send "last month's numbers" to an owner as a link, and it works without client JS. Malformed input degrades rather than breaking: an unknown preset or an impossible date like `2026-02-31` falls back to Today instead of erroring or silently returning an empty report.

Date handling is the part reports usually get wrong, so it's isolated in `src/lib/reports.ts` and tested directly:

- The end date includes its **whole** day (23:59:59.999) — an exclusive boundary would silently drop the last 23 hours of every report.
- Dates parse as **local**, not UTC — `toISOString()` shifts the day for anyone east or west of UTC.
- A reversed range is **swapped**, not rejected; picking the dates in the wrong order clearly meant the span between them, and an empty report would just look like "no sales".
- An over-long span is **trimmed from the start**, keeping the most recent data, and capped at 366 days so the aggregation can't scan years of rows.
- Quiet days are **seeded as zero**, so a trend line never jumps a gap and misrepresents a slow Tuesday as "no data".

**Breakdowns** cover fuel (revenue, volume, realised rate per litre, and what was bought), staff (ranked by revenue), and the cash/credit split. Voided sales are excluded from every total and reported separately, so a void can never quietly inflate takings.

**Cash movement is not profit,** and is labelled that way on the page. Fuel bought in a window isn't the fuel sold in it, so a large delivery shows as an outflow rather than a loss. Calling it "margin" would invite exactly the wrong read; proper COGS needs inventory valuation the schema doesn't carry yet.

## Testing

```bash
npm test          # 417 tests
```

**Unit** (no database) — `sale-math.test.ts` (16), `stock-math.test.ts` (24), `staff.test.ts` (23), `credit.test.ts` (26), `reports.test.ts` (32), `tenant.test.ts` (20), `username.test.ts` (23), `bs-date.test.ts` (31), and `proxy.test.ts` (14) cover the rules directly: rounding direction, Decimal exactness, credit headroom, ullage, rate-change percentages, cost/margin derivation, shift durations across midnight, reporting-window boundaries, local-vs-UTC date parsing, AD↔BS conversion, Nepali fiscal years, username and station-code normalisation, and the fat-finger limits.

**Integration** — `actions/sales.integration.test.ts` (25), `actions/stock.integration.test.ts` (24), `actions/employees.integration.test.ts` (33), `actions/customers.integration.test.ts` (32), `queries/reports.integration.test.ts` (28), `actions/tenancy.integration.test.ts` (22), `actions/auth.integration.test.ts` (15), and `actions/platform.integration.test.ts` (25) run the **real** Server Actions and report queries against a **real** throwaway SQLite database created per run. Only `requireUser()` and `revalidatePath()` are stubbed, since both are request-scoped Next.js concerns that can't exist outside a server render. Validation, permissions, the stock and capacity guards, the credit gate, receipt numbering, transaction rollback, cross-station isolation, password hashing, session revocation, the owner-lockout guards, the audit trail, and the report aggregation against a hand-computed dataset all execute for real.

All integration suites have been mutation-checked — deliberately breaking the sale stock guard fails exactly the three stock-protection tests, breaking the delivery capacity guard fails exactly the two capacity tests, disabling the self-lockout guards fails exactly the four owner-lockout tests, disabling the overpayment guard fails exactly the two overpayment tests, and making the report end-date exclusive (or letting voided sales into the totals) fails the report figures across the board. Nothing else moves, so the suites are pinning the behaviour they claim to.
"# petrolpumpManagment" 
