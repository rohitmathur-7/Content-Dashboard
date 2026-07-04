# July Content Calendar Dashboard

Next.js + Supabase app. Planner activities and shoot-prep details live in
one Postgres database; click any activity in the dashboard to view or edit
its prep details, saved straight to the DB.

## 1. Create a Supabase project

1. Go to https://supabase.com, create a free account and a new project.
2. Once it's provisioned, open **SQL Editor**, then copy and paste the SQL
  contents of `supabase/schema.sql` into a new query and run it (this creates
  the two tables + basic access policies).
3. Then copy and paste the SQL contents of `supabase/seed.sql` into a new
  query and run it (loads the 35 July planner rows, plus the "Back to School"
  prep details already known from the prep doc).
4. Go to **Project Settings > API** and copy:
   - Project URL
   - `anon` public key

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Paste your Project URL and anon key into `.env.local`.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see the dashboard loading data
from Supabase.

## 4. Deploy

Push this project to a GitHub repo, then:

1. Go to https://vercel.com, "Add New Project", import the repo.
2. Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings.
3. Deploy. Vercel gives you a live URL immediately, and redeploys
   automatically on every git push.

## How the shared prep sheet works

There are three tables now:

- `activity_types` — one row per unique activity ("Beach Party", "Fill It
  Up", "Back to School", etc.)
- `activities` — one row per dated instance (e.g. "Beach Party" on 13 Jul
  at T3, and again on 14 Jul at T5, etc.), each pointing at its
  `activity_type_id`
- `prep_details` — one row per activity **type**, not per date

So editing the prep sheet from any single "Beach Party" card updates it for
every date/branch that activity appears on. This matches the school's
request: one shared shoot-prep sheet per activity, regardless of how many
times it repeats on the calendar.

## Notes / next steps

- **Access control:** the current Supabase policies allow anyone with the
  anon key to read and write. Fine for an internal team tool behind a
  private URL; if you want to restrict who can edit, add Supabase Auth
  (email/password or magic link) and tighten the RLS policies to
  `using (auth.uid() is not null)`.
- **Adding new months:** insert new rows into `activity_types` and
  `activities` directly in Supabase's table editor, or build a simple "add
  activity" form in the dashboard later.
- **Renaming an activity type:** since prep sheets are keyed to
  `activity_types.name`, renaming an activity (e.g. "Beach Party" →
  "Beach Day") is a single update to that one row — every dated instance
  and its shared prep sheet follow automatically.
