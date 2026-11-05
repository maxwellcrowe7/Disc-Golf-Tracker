# Disc Golf Tracker — Rebuild Spec

Living document for the v2 rebuild. The approved visual direction is the **v4 "season atlas"** sample in `design-samples/` (v2 and v3 kept in subfolders for reference).

---

## 1. Goals

1. A professional, content-first UI — creative but never "extra". Design frames the data; it never competes with it.
2. Mobile-first (most entry happens on a phone), fully designed for desktop too.
3. Everything connected: any event, round, course, or league links to everything related to it, and every "add" flow pre-fills from where you started.
4. New: a season schedule (calendar, map, registration tracking, reminders, travel, budget).
5. New: event formats — singles, doubles, triples, team doubles, match play — and PDGA vs non-PDGA.
6. Fix the data-loss risk: today every save overwrites one JSON blob, so two open devices can erase each other's changes.

## 2. Design system (from the v4 sample)

**Concept:** the season as a printed field atlas. Courses are two-ink map plates, upcoming events are tickets, trips are receipts, and rounds use real scorecard notation.

| Element | Rule |
|---|---|
| Type | Fraunces (headlines, numbers) · Instrument Sans (UI) · Geist Mono (labels, units, metadata) |
| Color | Paper `#F2EDE1`, ink `#15211B`, forest `#163D2C`, moss `#2C6A47`. One accent — **disc orange `#FF5A1F`** — reserved for the disc, flight lines, the + button, countdowns, and section numbers. |
| Scorecard notation | Under par = circle · 5+ under = double circle · over par = box · even = plain. Applies everywhere a to-par number appears; match-play holes use the same shapes (won = filled circle, lost = box). |
| Status colours | Interested (slate) · Planning (amber) · Registered (green) · Waitlisted (orange) · Withdrew (brick) · Played (blue) · Recorded (ink) |
| Plates | Seeded per course: halftone elevation, contour ink, paper knock-out fairway, orange flight + basket, north arrow / scale bar / plate number. Dark mode = "night map". |
| Dark mode | Supported; light is the default. |

**Motion rules** (learned from v3 → v4):
- Nothing animates on its own or on scroll. Content renders in its final state immediately.
- Motion only answers an action: tab/segment indicators slide, sheets slide up, the status stamp lands, the score frame morphs circle ↔ box, the reminder bell rings, shared-element page transitions.
- The hero disc flight plays once per visit (replay on demand).
- `prefers-reduced-motion` disables all of it.

**Performance rules** (desktop lag investigation):
- No full-screen blend layers, no backdrop blur on scrolling or fixed chrome, no CSS filters on lists.
- Course plates are generated once and cached as images (data URL / blob per course × theme). Only the hero plate stays live SVG (for the disc flight).
- Small thumbnails use the lightweight plate variant (no halftone).
- Budget: 60 fps scroll on a mid-range phone and a Retina laptop in Safari.

## 3. Tech stack (matches the Task Tracker project)

- **Vue 3 + Vite + vue-router (hash routing)**, plain JavaScript, Vitest for tests.
- `src/components`, `src/lib`, `src/views` layout; `base: './'` for the GitHub Pages subpath.
- **Supabase** — same shared "Personal Tools" project. All tables prefixed **`dg_`**, every table owner-only via RLS.
- SQL lives in `supabase/schema.sql` + dated `supabase/migrations-YYYY-MM-DD-*.sql`, run in the SQL editor.
- **Supabase Edge Functions** for the four server-side jobs (section 7), deployed with the Supabase CLI.
- **Deploy:** GitHub Actions → GitHub Pages on push to `main` (repo secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- PWA: manifest + icons in the new style, service worker for push.
- **Rollout:** build on a branch; the current live app keeps running untouched until the switch. The old `app_state` row is never deleted — it stays as a backup.

## 4. Data model (Supabase, `dg_` tables)

All tables: `id uuid pk`, `user_id uuid default auth.uid()`, `created_at`, `updated_at`, RLS `auth.uid() = user_id`.

| Table | Key columns |
|---|---|
| `dg_profiles` | name, pdga_number, home_label, home_lat, home_lng, settings jsonb |
| `dg_rating_history` | effective_date, rating, source (`manual` / `pdga_import`) — unique per date |
| `dg_courses` | name, city, state, lat, lng, holes, terrain, length_ft, notes — **no par on courses** |
| `dg_leagues` | name, day_time, home_course_id, color, notes, active |
| `dg_events` | name, start_date, end_date, city, lat, lng, pdga (bool), tier, division, **format** (`singles`/`doubles`/`triples`/`team_doubles`/`match_play`), **status** (`interested`/`planning`/`registered`/`waitlisted`/`withdrew`/`played`/`recorded`), waitlist_pos, reg_opens_on, remind (bool), event_url, entry_fee, fee_split, **had_caddy** (bool), caddy_fee, rounds_planned, holes_per_match, team_name, partners text[], place, field_size, field_unit (`players`/`teams`), payout, home_drive_minutes, home_drive_miles (day trips; trips with lodging use `dg_lodging`), notes |
| `dg_event_courses` | event_id, course_id, drive_minutes, drive_miles (from lodging or home) |
| `dg_lodging` | event_id, type, name, address, lat, lng, nights, cost, split, drive_minutes, drive_miles (from home) |
| `dg_rounds` | **kind** (`tournament`/`league`/`casual`), event_id, league_id, course_id, played_on, round_number, **par** (entered with every round), score, rating, place, field_size, fee, payout, is_team (bool), notes |
| `dg_matches` | event_id, match_number, course_id, opponent, opponent_team, holes text (`W`/`P`/`L` per hole), hole_count, result (`W`/`P`/`L` — derived from holes, or entered directly when holes weren't tracked), notes |
| `dg_push_subscriptions` | endpoint, keys jsonb, device_label |

**Par rule:** par is entered with every round. Courses never carry a par or a layout setting — even a course with one unchanging layout gets its par typed on each round.

**Writes are per row** (insert/update/delete one record) — no more whole-blob overwrites.

### Migration from the current app
One-time script reads the existing `app_state` JSON and writes the new tables:
- `tournaments` → `dg_events` (status `recorded`; `year` dropped; `numDays` → end_date; `prize` → payout; `caddy` → had_caddy + caddy_fee; `courses` → `dg_event_courses`)
- `tRounds` → `dg_rounds` (kind `tournament`)
- `leagues` → `dg_leagues` · `leagueRounds` → `dg_rounds` (kind `league`)
- `courses` → `dg_courses` (geocoded from city for the map)
- `pdgaRating` → one `dg_rating_history` row dated the migration day
- Dry-run report first (counts + anything that didn't map), then write.

## 5. Screens

### Home
Next tee (hero plate + countdown + registration reminder) · The climb (player rating history) · Ledger (season events / signed up / est. cost / miles) · Season trail · Before the next round (to-dos) · League nights · Scorecard (recent results). Career totals live on the Results recap (Season / Career switch).

### Schedule (2027 season and onward)
Tally strip · **Tickets** (timeline grouped by month) / **Calendar** (month grid incl. registration-open days) / **Map** (pins by status, drive-time toggle) · status filters · add event.

### Event detail
Upcoming: registration ticket (opens date, fee, reminder toggle, status stamp) · status stations · courses · partner/team · travel (home → lodging → courses with drive times, mini-map) · trip estimate receipt.
Past: result strip · scorecard (rounds, add missing round) or match list · field notes · status · receipt (fees, caddy, lodging, gas, payout, net).
Edit and delete.

### Rounds (new — replaces the old Rounds tab; lives at Results → Rounds, `#/results/rounds`)
One sortable table of every round (tournament, league, casual). Filters: season, kind, event, course, format, rating range. Quick filters such as **1000+ rated**, **This season**, **Under par**. Tap a row → its event/league/course.

### Results
Season recap · Tournaments (scorecard rows by year, with filters/search/sort) · Leagues (each league: rounds, wins, podiums, avg finish %, net, season-by-season breakdown, rounds list) · Stats (section 6).

### Courses — the atlas
Plate grid with search · course page: plate banner, field notes (rounds, avg to par, best, avg rating, best/worst rating), score spread, round history, events here, notes. Add / edit / delete course.

### Leagues
Create / edit / delete league (name, day & time, home course, color, notes). League page as described under Results.

### Settings
Player name, PDGA number + profile link, home location (for drive times), rating history (add entry, import from PDGA, paste-in fallback), push notification permission, theme, export backup (JSON) / import backup, sign out.

### Sign-in
Email + password sign in, create account, forgot password, set new password — restyled to the atlas look.

### Log sheets (mobile bottom sheet / desktop dialog)
Tournament round (event locked, next unlogged round, course auto/suggested, date from event days, par typed in (blank every time), score pad, rating, notes) · League round (home course + last league night, place/field with live percentile, fee/payout with live net) · Match (opponent, team, tap-per-hole W/P/L) · Event (link autofill, format-specific fields, PDGA tier/division, status, fees, caddy toggle, registration date) · Course · League.
**Guards:** "discard unsaved changes?" when a dirty sheet is dismissed (including swipe-down), duplicate-round warning, delete confirmations.

## 6. Stats (reviewed — all kept)

A **Results → Stats** view with a **Season / Career** switch. Each block keeps the old app's numbers, restyled.

| Block | Where it lives |
|---|---|
| Tournament performance (events, avg round rating, best rating, wins, avg finish %) | Top of Stats |
| League performance (rounds, wins, podiums, net, cash in/out) | Stats (all leagues combined) + each league page |
| Placements by tier (events, top 10s, avg place) | Stats table |
| Division history (events, wins, years per division) | Stats |
| Financials (fees, caddy, lodging, gas, earnings, overall net) | Stats — now fed by trip receipts |
| Average rating by year (avg + best round rating per season) | Stats, beside the climb chart |
| Best & worst rated rounds (top / bottom 3) | Stats block; also a "Top rated" quick sort on the Rounds page |
| Course averages (rounds, avg / best / worst rating) | Stats table; also "sort by avg rating" in the atlas |
| Career totals (events, rated rounds, best finish, career net) | Results recap card with the Season / Career switch |
| Top courses by avg rating | Atlas sort + Stats course table |

## 7. Server-side jobs (Supabase Edge Functions)

| Function | Why it can't run in the browser | Fallback |
|---|---|---|
| `event-autofill` — read a PDGA / Disc Golf Scene event URL, return name, dates, location, tier, fee, registration date | Browsers block one site from reading another's pages | Type details manually |
| `drive-times` — home → lodging → courses times/miles; geocode cities | Only if the routing provider needs a secret key. With Mapbox, a public token locked to the site's address can call directions straight from the browser, so this may not need a function at all. | Times left blank |
| `send-reminders` — scheduled daily; web push at 8:00 AM on registration-open day | Must run while the app is closed | In-app "Registration opens in N days" flags |
| `pdga-ratings-import` — read the player's PDGA ratings history into `dg_rating_history` | Same cross-site restriction | Paste date + rating rows |

Notes: autofill and the ratings import read PDGA / Disc Golf Scene pages and may need adjusting if those sites change. Web push on iPhone requires the app to be added to the Home Screen.

## 8. Feature parity checklist (current app → rebuild)

| Current feature | Rebuild |
|---|---|
| Email sign in / create account / sign out | Sign-in screen |
| Forgot / reset password | Sign-in screen |
| Cloud sync (one JSON blob) | Per-row tables (fixes overwrite bug) |
| Local-storage → cloud migration | Replaced by app_state → tables migration |
| Player name, PDGA number, PDGA profile link | Settings |
| Manual PDGA rating | Rating history (manual + import) |
| Export / import JSON backup | Settings |
| Installable PWA | Kept, new icons |
| Dashboard stat tiles | Results recap (Season / Career) |
| Recent tournaments / league rounds | Home scorecard + league nights |
| Rating chart (was round ratings) | The climb (player rating history) |
| Top courses by avg rating | Atlas sort + Stats course table |
| Stats tab (8 blocks) | Results → Stats, all kept (section 6) |
| Tournament list + filters (year, tier, division, search) + sorting | Results → Tournaments |
| Tournament fields: name, dates, location, tier, division, field size, rounds, placing, URL, fee, prize, caddy, courses, notes | Event sheet + results step; caddy fee only when "had a caddy" is checked |
| Tournament detail panel | Event page |
| Edit / delete tournament | Event page |
| Rounds table + filters (tournament, course, year) + sorting | Rounds page |
| Add / edit / delete tournament round, duplicate check, date/course suggestions | Round sheet |
| League definitions (name, day/time, home course, notes, color) | League create/edit |
| League detail (wins, podiums, net, avg finish %, season breakdown) | League page |
| League rounds list + filters + sorting | League page + Rounds page |
| Add / edit / delete league round, live percentile + net | League round sheet |
| Courses grid (tourney/league rounds, avg/best/worst rating) | Atlas + course page |
| Add / edit / delete course (name, location, notes) | Course sheet (+ lat/lng, holes, terrain) |
| Course detail (tournaments, rounds, league rounds, see-more) | Course page |
| Unsaved-changes guard | Sheet guard |
| Delete confirmations | Kept |
| Toasts | Kept |

## 9. Build order

1. Project scaffold (Vite + Vue, router, design tokens, components from the sample) and GitHub Actions deploy to a preview path.
2. Schema + RLS + migration script (dry run against an export, then real).
3. Auth + Settings + rating history.
4. Courses, leagues, events, rounds — CRUD and the log sheets.
5. Home, Schedule (tickets/calendar/map), event and course pages, Rounds page, Results, Stats.
6. Edge Functions: autofill, drive times, ratings import, reminders + push.
7. Plate image caching + performance pass (Safari, Retina, mid-range phone).
8. Switch the live site over; keep the old blob as a backup.

## 10. Open items

- Routing/map provider account (Mapbox recommended: map tiles, geocoding, and directions under one free-tier key).
- Supabase CLI login on this Mac (for deploying Edge Functions).
- A JSON export of the current data (for the migration dry run).
