# Psychology Booking Site — Next.js

## What this is
A near-complete build: public site with real content, dark/light mode,
Albanian/English i18n, a fully wired booking wizard, admin panel,
self-service cancel/reschedule, patient accounts with a session dashboard,
and chat/messaging per booking.

## Run it locally
```bash
npm install
npm run dev
```
Then open http://localhost:3000 — it redirects to `/sq` (Albanian, default).
Admin panel: `/admin` (not locale-prefixed). Patient login: `/[locale]/login`.

**Before it fully works, you need to:**
1. Create a free Supabase project at supabase.com
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. In Supabase → Authentication → Settings, **disable public signups**
   (this only affects the admin login — patients use a separate, custom
   magic-link system that doesn't touch Supabase Auth at all, see below)
4. Authentication → Users → manually create the psychologist's one login
5. Create a free Resend account at resend.com, get an API key
6. Copy `.env.example` to `.env.local` and fill in every value — see the
   comments in that file for what each one is and where to find it
7. Log into `/admin/login`, set her weekly hours in Calendar, and fill in
   her bio/pricing/meeting link in Settings

## Why patient accounts don't use Supabase Auth
Supabase Auth's signup needs to be **disabled** so only the psychologist can
reach `/admin` — but patients need to be able to self-register. Reusing the
same user pool for both would mean either patients can't sign up, or the
admin lockdown doesn't actually lock anyone out. Instead, patient accounts
use a separate, simple system: a `patient_sessions` table (same pattern as
the booking `cancel_token` links), emailed as a magic link, checked
server-side via an httpOnly cookie. It's deliberately low-tech but keeps
the two account systems from ever conflicting.

## What's built
- Pages: Home, About, Services, Book, FAQ, Contact, Privacy, Terms — all
  with real, substantial content (not just placeholders), in Albanian/English
- Dark/light mode, language switcher
- 6-step booking wizard, wired to a real Supabase database
- **Real availability logic** (`lib/availability.ts`) — reads weekly rules,
  respects blocked dates, filters out already-booked times
- **Secure booking submission** — through `app/api/bookings/create`
  (service role key, not a direct client insert), so `bookings`/`patients`
  need zero public RLS policies
- Confirmation, reminder (24h before), and cancellation emails — all bilingual
- **Self-service cancel and reschedule** from a private link in every email
  (`/[locale]/manage/[token]`)
- **Patient dashboard** (`/[locale]/dashboard`) — see upcoming/past sessions,
  reachable via the "My Sessions" link in the header or a magic-link email
  sent automatically when they check "save my info" at booking time
- **Chat/messaging** — for chat/async format bookings, both the patient
  (on their manage page) and the admin (in the Bookings list) can send
  messages back and forth. Uses polling (refreshes every 5 seconds), not
  live websockets — a deliberate tradeoff since patients don't have real
  Supabase Auth sessions to authenticate a websocket connection with.
  **Both sides get an email notification when a new message arrives** —
  set her notification email in `/admin/settings`, otherwise she won't be
  alerted when a patient messages her
- **Admin-editable pricing** — individual/couples price and cancellation
  policy are set in `/admin/settings` and shown live on the Services page
- **Admin panel** (`/admin`) — magic-link login, weekly availability +
  blocked dates, bookings list with private session notes and chat, settings
- **Auto-attached Zoom/Meet links** for video sessions
- Design system: warm pine/clay/linen palette, Fraunces + Karla fonts,
  organic shapes instead of stock photography (see `tailwind.config.ts`)

## What's still not built
1. **True realtime chat** — currently polling-based (see above); upgrading
   to instant delivery would need patients to have real authenticated
   sessions recognized by Supabase's Realtime service
2. **Some content is still placeholder** — About page bio/credentials/photo
   need her real input; pricing figures are illustrative until she sets
   real ones in `/admin/settings`

## Cron setup (reminder emails)
The reminder email endpoint (`/api/cron/send-reminders`) needs to be called
on a schedule — it doesn't trigger itself. `vercel.json` is already set up
to call it every hour automatically if deployed on Vercel (which also sets
`CRON_SECRET` for you). On another host, use any external scheduler (e.g.
cron-job.org) to hit that URL hourly with header
`Authorization: Bearer YOUR_CRON_SECRET`, matching `.env.local`.

## Database migrations
Run migrations **in order** if you already had a database from an earlier
version of this project:
1. `supabase/migration_001_meeting_link.sql`
2. `supabase/migration_002_cancel_token.sql`
3. `supabase/migration_003_reminders.sql`
4. `supabase/migration_004_pricing.sql`
5. `supabase/migration_005_patient_accounts.sql`
6. `supabase/migration_006_messages_rls.sql`
7. `supabase/migration_007_message_notifications.sql`

Fresh setups should just use `schema.sql` — it already includes everything,
skip the migration files entirely.

## Stack
Next.js 14 (App Router) · Tailwind CSS · next-intl · next-themes ·
Supabase (Postgres + custom patient sessions) · Resend · lucide-react

## Note on payments
Deferred — Stripe isn't available for Kosovo-based merchants. See the
architecture doc for alternatives to revisit later (business entity in a
supported country, alternate provider, or manual payment).
