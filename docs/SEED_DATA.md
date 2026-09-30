# Development seed data (F0-16)

Local development data that matches the Figma designs at the reference date **Monday 30 November 2026** (Australia/Melbourne). Synthetic people and figures only. **Local only — never production.**

## Loading it

```bash
supabase start          # once
supabase db reset       # rebuilds the database and loads supabase/seed.sql
npm run db:seed         # uploads the five placeholder PDFs to local Storage
```

- `supabase db reset` gives identical data every run (fixed ids, fixed password salt, explicit timestamps).
- `supabase/seed.sql` refuses to run against a database that already has an organisation or a user, so it cannot add rows to a live database. `supabase db push` never runs it.
- `npm run db:seed` (`scripts/seed.mjs`) exits non-zero, without any request, when `NODE_ENV=production` or when `NEXT_PUBLIC_SUPABASE_URL` is not `127.0.0.1` / `localhost`. Run it after every `db reset`; running it twice is safe.
- Only lane B runs `supabase db reset` (docs/AGENT_REFERENCE.md).

## Sign-in

Every seeded user has the password **`care-compass-local-1!`** (local only).

| Person | Role | Email |
|---|---|---|
| Helen Doyle (Margaret's daughter) | family | `helen.doyle@example.com` |
| Michael Hale (Robert) | family | `michael.hale@example.com` |
| Susan Marsh (Elsie) | family | `susan.marsh@example.com` |
| Karen Novak (Frank) | family | `karen.novak@example.com` |
| Tom Petrov (Doris) | family | `tom.petrov@example.com` |
| Aisha Rahman, Registered Nurse | carer | `aisha.r@banksiahomecare.com.au` |
| Daniel K., Registered Nurse | carer | `daniel.k@banksiahomecare.example` |
| Sarah Nguyen, Enrolled Nurse | carer | `sarah.nguyen@banksiahomecare.example` |
| Marcus Chen, Support Worker | carer | `marcus.chen@banksiahomecare.example` |
| Fatima Ali, Support Worker | carer | `fatima.ali@banksiahomecare.example` |
| Priya Iyer | admin | `priya.iyer@banksiahomecare.example` |
| Owen Patel (Kookaburra Care) | admin | `owen.patel@kookaburracare.example` |
| Grace Liu (Kookaburra Care) | carer | `grace.liu@kookaburracare.example` |
| Rita Simmons (Walter) | family | `rita.simmons@example.com` |

Harold and Jean have no family account in the design. Admins reach `/admin/home` only after the TOTP step (OQ-08).

## What is in it

- **Banksia Home Care** (ABN 54 123 456 789, 03 9555 0102, 220 High St, Preston VIC 3072) with seven clients: Margaret Doyle 78 Preston, Robert Hale 82 Reservoir, Elsie Marsh 90 Thornbury, Frank Novak 76 Northcote, Doris Petrov 85 Preston, Harold Byrne 79 Coburg, Jean Ahmed 88 Fairfield.
- **Kookaburra Care**, a second organisation with an admin, a carer and one client (Walter Simmons), for tests that must prove one organisation cannot read another.
- **Margaret**: Description, Habits and Medical history (design text); documents Care plan, Medication schedule, Physio referral, Exercise plan, Medication chart; seven events; budgets.
- **Robert**: two events, three budget buckets, one completion history, for tests that must not see Margaret's data.
- **Access is from shifts** (F0-18): a carer sees a client only while a shift with that client has not ended. Aisha has shifts with all seven clients; Daniel with Robert; Sarah, Marcus and Fatima with Margaret. Because the shifts are in Nov–Dec 2026, they grant read access to a carer signing in today; a carer is on an *active* shift (edit rights) only when the real clock is inside one.

### Margaret's events (start = first occurrence, in the design week)

| Event | First occurrence | Duration | Repeats |
|---|---|---|---|
| Wound dressing check | Thu 26 Nov 10:00 | 30 min | weekly |
| Morning medication | Fri 27 Nov 09:00 | 1 hr | daily |
| Weekly weigh-in | Sun 29 Nov 09:30 | 15 min | weekly |
| Evening medication | Sun 29 Nov 18:00 | 30 min | daily |
| Medication review | Sat 28 Nov 14:00 | 30 min | fortnightly |
| Physiotherapy ($90, NDIS) | Mon 30 Nov 11:30 | 1 hr 30 min | weekly |
| Afternoon check-in | Mon 30 Nov 15:00 | 1 hr | daily |

States on Mon 30 Nov: **Done** — Morning medication 27 to 30 Nov, Evening medication 29 Nov, Wound dressing check 26 Nov; **Overdue** — Weekly weigh-in (29 Nov) and Medication review (28 Nov); **Planned** — Physiotherapy and Afternoon check-in.

### Margaret's budget

| Bucket | Total | Used | Remaining |
|---|---|---|---|
| NDIS | 24,000 | 9,120 | 14,880 |
| Fixed | 5,000 | 2,250 | 2,750 |
| Government | 3,000 | 2,760 | 240 |

Fund history: 3 Nov 2026 +$6,000 "NDIS quarterly plan top-up"; 15 Oct 2026 +$1,000 "Fixed funding top-up"; 1 Oct 2026 +$750 "Government subsidy payment". The design's history is partial, so each bucket has a 1 Jul 2026 **Opening balance** entry (18,000; 4,000; 2,250) that makes the totals agree (FD-03). Used amounts are paid costs with no event.

### Shifts

Aisha with Margaret on Mon 30 Nov: 08:00–10:00, **11:30–13:00** (the shift the admin conflict warning overlaps) and 14:30–16:00; also Thu 26, Fri 27, Sun 29 Nov and Tue 1, Wed 2 Dec. One future shift with each of the other six clients (1–4 Dec). Daniel with Robert on Sun 29 Nov.

## Fixed ids

Tests can rely on these (the last digits are the entity number):

| Entity | Id |
|---|---|
| Banksia Home Care / Kookaburra Care | `a0000000-0000-4000-8000-00000000000{1,2}` |
| Clients Margaret, Robert, Elsie, Frank, Doris, Harold, Jean, Walter | `c0000000-0000-4000-8000-00000000000{1..8}` |
| Priya (admin) | `10000000-0000-4000-8000-000000000001` |
| Helen, Michael, Susan, Karen, Tom (family) | `10000000-0000-4000-8000-0000000000{11..15}` |
| Aisha, Daniel, Sarah, Marcus, Fatima (carers) | `10000000-0000-4000-8000-000000000{101..105}` |
| Owen, Grace, Rita (Kookaburra Care) | `10000000-0000-4000-8000-000000000{201..203}` |
| Margaret's events (Morning, Evening, Physio, Check-in, Weigh-in, Med review, Wound) | `e0000000-0000-4000-8000-00000000000{1..7}` |
| Robert's events (Morning medication, Blood pressure check) | `e0000000-0000-4000-8000-0000000000{11,12}` |
| Margaret's buckets (NDIS, Fixed, Government) | `b0000000-0000-4000-8000-00000000000{1..3}` |
| Robert's buckets (NDIS, Fixed, Government) | `b0000000-0000-4000-8000-0000000000{11..13}` |
| Margaret's documents | `d0000000-0000-4000-8000-00000000000{1..5}` |

## Not in the seed

- Production data, and the client's sample Care Need Items (import when supplied).
- The long Task log history the mock fixtures generate (`src/mocks/history.ts`); only the design week is seeded.
- Notifications (there is no table yet), and any pending (unpaid) cost: a pending cost would move Government from the design's 92% alert to depleted.

## Changing it

Edit `supabase/seed.sql`, run `supabase db reset` then `npm run db:seed`, and update this file and `tests/integration/shared-dev-seed-data.test.ts`.
