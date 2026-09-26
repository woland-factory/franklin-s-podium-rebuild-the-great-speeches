# EPIC SPEC — The spaced loop and the attempt archive

## Quality differentiator (read this first)

**The alignment surface.** This product wins by turning the gap between
your spoken words and a master's into a neutral study object you examine,
never a score you fail. Delivery coaches grade how you sound; recitation
checkers punish any deviation. Franklin's Podium aligns your spoken
reconstruction to the original sentence by sentence, tolerant of
paraphrase, and shows the two side by side so you see the move you missed.

**What this demands of THIS EPIC:** the alignment surface already exists
(EPIC 1) and is reachable on day one for any curated speech (EPIC 2). This
EPIC makes the practice *compounding*: it enforces the forgetting gap that
makes a cold attempt worth studying, and it keeps every attempt so a
returning user can lay this month's reconstruction beside last month's and
see the distance closed. The compare view is a second appearance of the
same neutral surface, applied to two of the user's own takes. It inherits
the differentiator contract in full: no percentage, no pass/fail, no
word-level red ink, ever, not even when comparing two attempts to each
other. A comparison that ranks one attempt "better" than another is a
product failure even if every test passes. Show the two; let the user
read the gap.

---

## 1. Scope

### In scope
On top of the EPIC 1 reconstruction loop and the EPIC 2 library, build the
mechanism that turns a one-off reconstruction into deliberate practice:

1. **The scheduled cold attempt.** From a speech's read screen, the user
   schedules a cold attempt some days out. The gap is stored locally. The
   cold attempt is held closed until the reveal time, with a clear
   countdown, while the same-day warm-up stays available the whole time.
2. **A calendar file.** The user can download an `.ics` file for the reveal
   date so the reminder lives in their own calendar. No email, no push.
3. **The accumulating archive.** Every reconstruction (warm-up or cold) is
   saved to a per-speech archive with its timestamp, transcript, alignment,
   and optional audio. A per-speech archive screen lists them newest first.
4. **Compare two attempts.** Redoing a speech shows a previous attempt
   beside the new one, and from the archive the user can pick any two of
   their attempts and view them side by side, each rendered on the same
   neutral alignment surface.
5. **Fast at scale.** The archive stays fast as it grows: lists are
   paginated (a capped page plus a load-more control), and every IndexedDB
   read on a hot path goes through an index. No view gets slower with every
   attempt saved.

### Out of scope (binding non-goals — do not build)
- **No trendline charts, scorelines, streak counters, or analytics of any
  kind.** The archive is a list and a side-by-side compare, never a graph,
  a "you improved" verdict, or an aggregate number that ranks attempts.
- **No ledger / stolen-phrases saving**, and no save-a-phrase control
  anywhere. That is EPIC 4.
- **No paste-your-own-text mode and no hint extraction.** EPIC 4.
- **No export of the archive to a file.** JSON/Markdown export is EPIC 4.
  This EPIC persists and displays the archive; downloading it is later.
- **No reminder emails and no push notifications.** The return nudge is the
  `.ics` file only. No mailer call, no service worker, no Notification API.
- **No scores, grades, percentages, pass/fail, or word-level red ink**,
  anywhere, on any speech, including the compare view.
- **No new alignment algorithm and no three-way alignment.** Reuse
  `align()`, `cleanTranscript`, `segmentSentences` exactly as they are.
  Compare renders two independent existing alignments; it does not compute
  a new cross-attempt alignment.
- **No accounts, no server storage, no network upload, no cloud
  transcription, no runtime LLM, no BYOK, no gateway calls.** Fully
  client-side. The only new artifact leaving the app is the `.ics` file the
  user downloads to their own machine.
- **No storage-eviction / retention policy.** Attempts (including audio)
  persist until the browser clears them. If unbounded audio storage looks
  like a real risk in testing, report it and raise a `requested_task`; do
  not build eviction here (it would be drift, and it risks deleting a
  user's own record).
- **No changes to the first-run walk.** The EPIC 2 walk teaches the warm-up
  loop and ends at the first alignment. Do not add a scheduling step to it.

---

## 2. Quality-bar obligations that land in THIS EPIC

The quality bar is spec. The clauses that bite here, made concrete:

- **Perceived speed (§1).** This is the headline acceptance criterion for
  this EPIC, so it is load-bearing, not a footnote.
  - Every per-speech read on a hot path (latest attempt, attempt count,
    a page of attempts, the schedule) MUST go through an IndexedDB index or
    a primary-key lookup. NO full-store scan and NO `getAll()` that returns
    every attempt to filter in JS. A store that grows to hundreds of
    attempts across speeches must not slow the archive of a speech with
    three.
  - The archive list is paginated with a fixed page size (default 10) and a
    load-more control. It never renders an unbounded list.
  - Scheduling, downloading the `.ics`, opening the archive, and switching
    the compared attempt all give feedback within 100ms (pressed states,
    immediate view change, optimistic UI). The `.ics` is built synchronously
    in-memory and downloaded; no spinner.
  - Adding the archive/schedule code must not pull the ASR/model chunk into
    the initial bundle (it stays dynamically imported, as in EPIC 1).
- **Mobile-first (§2).** Every new surface fully usable at 390px: the
  schedule panel, the countdown, the archive list, and the compare view.
  No horizontal scroll. Touch targets (gap presets, add-to-calendar,
  archive rows, compare selectors) at least ~44px. The compare view MUST
  degrade to a single stacked column at 390px (two full alignment surfaces
  side by side would overflow); side-by-side columns are a wide-viewport
  enhancement only.
- **Designed states (§3), per surface:**
  - *Schedule panel:* three states, each designed and positive. No schedule
    yet (invite to schedule a cold attempt, warm-up offered). Waiting
    (countdown, warm-up still offered, add-to-calendar offered). Ready (the
    cold attempt is open now). The waiting-vs-ready split loads without a
    layout jump: reserve the panel's space while the schedule loads.
  - *Archive:* a designed empty state for a speech with no attempts yet
    ("Your attempts collect here. Warm up to add the first.") in positive
    voice; a loading state that holds layout (skeleton rows, not a white
    gap) while the first page reads; the populated list otherwise.
  - *Compare:* if only one attempt exists there is nothing to compare;
    say so in the product's voice and offer to record another, never a
    broken or blank compare.
  - EPIC 1/2 states (model skeleton, mic-denied, transcribe-failed,
    no-speech, unknown-speech not-found) carry over unchanged.
- **Radically simple interface (§7).** The read screen keeps ONE primary
  action at a time. Before a reveal, the primary is the warm-up; the
  schedule sits as a clearly subordinate panel. Once a scheduled reveal has
  arrived, the primary becomes the cold attempt and the warm-up drops to
  secondary. Never show two competing primary buttons. The archive row is
  a timestamp, a mode label, and a short line, not a paragraph. Cut words.
- **Copy sounds human (§8).** Sweep every user-visible string you add or
  change: the schedule panel, gap presets, countdown text, add-to-calendar
  label, the `.ics` `SUMMARY`/`DESCRIPTION` (these land in the user's
  calendar and ARE product voice), archive intro/empty/rows, compare
  headers and its one-attempt state. Ban em-dashes and en-dashes, the
  banned LLM vocabulary, and negative empty-state phrasing. Note in
  particular: **do not use the word "unlock"** in any user-visible string
  (it is on the banned list). Use "opens", "ready", or "available".
- **Accessibility (§6).** The countdown updates via `aria-live="polite"` so
  it is announced without stealing focus; it is not the only signal (the
  cold-attempt control's disabled state and label also convey it). Gap
  presets are real, labelled buttons or a labelled radio group. The archive
  is a real list with keyboard-reachable rows, each with an accessible name
  including its date and mode. Compare selectors are labelled. Every new
  screen has a proper `<h1>`/`<h2>` structure and visible focus states.
- **Security hygiene (§5).** No new server, no upload, no new external
  fetch, no new origin. The `.ics` is generated in-memory and offered as a
  `Blob` download; it never round-trips a server. The CSP/COOP/COEP posture
  from EPIC 1 is untouched. There is still no untrusted network input; the
  only user input is the chosen gap (validate it: a positive integer number
  of days within a sane bound; reject anything that is not a genuine
  multi-day gap).
- **README (§9).** Add the spaced loop and the archive to the "how it
  works" description: the app now holds you to a forgetting gap, gives you a
  calendar file, and keeps every attempt so you can compare them. Keep the
  run/dev/test commands accurate. Point at where the new code lives
  (`src/lib/db.ts` for persistence, `src/lib/ics.ts` and
  `src/lib/schedule.ts` for the loop). No pipeline internals.

---

## 3. Technical design — data model and persistence

### 3.1 What exists (build on it, do not rebuild)
- `src/lib/db.ts` opens `franklins-podium` at `DB_VERSION = 1` with a single
  object store `attempts` keyed by `id`, where today `saveAttempt` forces
  `id = speech_id` so exactly one overwritable attempt exists per speech.
  `getLatestAttempt(speechId)` does a primary-key `get(speechId)`.
- `first_run_done` is a `localStorage` flag; keep it there.
- `src/types.ts` defines `Attempt` (`id`, `speech_id`, `created_at`,
  `transcript`, `corrected_transcript`, `audio_blob`, `alignment`).
- `src/App.tsx` runs `record → transcribing → correct → study`, saves the
  attempt in `handleStudy`, and restores one attempt per speech via
  `restoreLatest`.
- The IndexedDB store is schemaless, so adding fields to `Attempt` is a
  non-breaking forward add.

### 3.2 Forward-only migration to a real archive (`DB_VERSION` 1 → 2)
The single overwrite-by-`speech_id` scheme is the thing that must change,
and it is the riskiest part of this EPIC. Do it as a forward-only
migration; never rewrite or delete existing records.

- **Bump `DB_VERSION` to `2`.**
- **Attempt id becomes unique per attempt.** New attempts get a unique id
  (`crypto.randomUUID()`, or `` `${speech_id}:${created_at}` `` if a stable
  scheme is preferred). `saveAttempt` STOPS forcing `id = speech_id`; it
  writes the caller-supplied unique id. Two attempts for the same speech now
  coexist instead of overwriting.
- **Add indexes on the `attempts` store**, created in `onupgradeneeded`
  when upgrading to v2 (indexes build over existing rows automatically):
  - `by_speech_created` — compound key `["speech_id", "created_at"]`. This
    is the workhorse: per-speech, newest-first pagination via a cursor, and
    "latest attempt" as the first row of a `"prev"` cursor. Both are index
    range scans, never full-store scans.
  - (Optional) `by_speech` on `"speech_id"` for `count()`; the compound
    index can also serve counts over a bound range, so a second index is
    only for convenience. Pick one; do not add unused indexes.
- **Existing rows survive.** A pre-migration record has `id == speech_id`
  and a real `speech_id`/`created_at`, so the new index includes it and it
  becomes that speech's first archived attempt. No data rewrite. A new
  attempt for the same speech gets a different id and is appended.
- **Add a `schedules` object store** keyed by `speech_id`, created in the
  same v2 upgrade. One active schedule per speech; scheduling again
  overwrites it. No index needed (primary-key lookup only).

Guard the whole file's IndexedDB access exactly as today
(`typeof indexedDB === "undefined"` rejects), so jsdom without a shim still
degrades instead of throwing.

### 3.3 Type changes (`src/types.ts`)
- `Attempt` gains `mode: "warmup" | "cold"`. Forward-additive. When reading
  a pre-migration record that lacks `mode`, treat it as `"warmup"` (that is
  what EPIC 2 recorded). Never crash on a missing field.
- Add `ScheduleEntry`:
  ```ts
  export interface ScheduleEntry {
    speech_id: string;
    condensed_at: number;  // when the user scheduled (proxy for "has read the moves")
    reveal_at: number;     // epoch ms when the cold attempt opens
    status: "waiting" | "ready" | "done";
  }
  ```
  `waiting` vs `ready` is DERIVED at read time from `reveal_at` vs now (see
  `src/lib/schedule.ts`); persist `status` so `done` (a cold attempt was
  completed against this schedule) is durable. Do not rely on the persisted
  `status` to decide waiting/ready; recompute those from the clock so a
  reload after the reveal reflects reality.

### 3.4 New/changed `db.ts` API (all index-backed)
- `saveAttempt(attempt: Attempt): Promise<void>` — writes with the unique
  `attempt.id` (no more `id = speech_id`).
- `getLatestAttempt(speechId): Promise<Attempt | null>` — reimplemented as
  the first row of a `"prev"` cursor on `by_speech_created` bounded to
  `speechId`. Still the API `restoreLatest` uses.
- `listAttempts(speechId, opts?): Promise<{ items: Attempt[]; nextCursor: T | null }>`
  — newest-first page via the compound-index cursor, page size capped
  (default 10). `opts` carries the cursor/offset for the next page. MUST be
  a bounded index range scan, not `getAll()`.
- `countAttempts(speechId): Promise<number>` — index `count()` over the
  speech's range. Used for the "Past attempts (N)" affordance.
- `getAttempt(id): Promise<Attempt | null>` — primary-key `get` for opening
  one attempt in the archive/compare.
- `saveSchedule(entry: ScheduleEntry): Promise<void>`,
  `getSchedule(speechId): Promise<ScheduleEntry | null>`,
  `markScheduleDone(speechId): Promise<void>` (or fold into `saveSchedule`).

Keep all reads index- or key-based. A code review WILL check that no hot
path calls `getAll()` on the whole store or filters in JS.

### 3.5 Schedule + countdown logic (`src/lib/schedule.ts`, pure)
Pure, unit-testable functions so the gating logic is proven without a DOM:
- `scheduleState(entry: ScheduleEntry | null, now: number): "none" | "waiting" | "ready" | "done"`.
  `done` when `entry.status === "done"`; else `ready` when
  `now >= reveal_at`; else `waiting`; `none` when `entry` is null.
- `revealAtFromDays(now: number, days: number): number` — `now + days*86400000`.
- `formatCountdown(msRemaining: number): string` — a short human string in
  product voice, for example `"2 days, 4 hours"` or `"under an hour"`. No
  em-dashes; swept copy.
- Validate the gap: `days` is an integer `>= MIN_GAP_DAYS` (MIN = 2, so it
  is genuinely a multi-day forgetting gap) and `<= MAX_GAP_DAYS` (for
  example 30). Reject out-of-range input rather than storing it.

### 3.6 Calendar file (`src/lib/ics.ts`, pure)
- `buildIcs({ title, revealAt, now }): string` returns a valid RFC 5545
  `VCALENDAR` with one `VEVENT`:
  - `DTSTART` at `revealAt`, `DTEND` at `revealAt + 15min` (a short rep).
  - `SUMMARY` in product voice, for example
    `Cold attempt: rebuild The Gettysburg Address from memory`.
  - `DESCRIPTION` one plain line, for example
    `Open Franklin's Podium and speak this speech from memory before you look at it.`
  - `UID` unique and stable per schedule (for example
    `` `${speechId}-${revealAt}@franklins-podium` ``), `DTSTAMP` at `now`.
  - CRLF line endings, timestamps in UTC `Z` form, text values escaped
    (`,`, `;`, `\`, newlines) and long lines folded per the spec.
- A small download helper offers the string as a
  `text/calendar` `Blob` via a temporary object URL. It touches no network.
- The `SUMMARY`/`DESCRIPTION` strings ARE product voice: sweep them.

---

## 4. Technical design — navigation and screens

### 4.1 Navigation (extend `src/lib/nav.ts`, do not add a router)
- Add an `archive` view. Hash routes become:
  - `#/` → library
  - `#/speech/:id` → read
  - `#/speech/:id/warmup` → reconstruct (warm-up)
  - `#/speech/:id/archive` → archive (NEW)
- Keep `parseHash`/`buildHash` pure and update `nav.test.ts` for the new
  route. `View` gains `"archive"`.
- The cold attempt reuses the existing `reconstruct` view. Its `mode`
  (`warmup` vs `cold`) is held in `App` state, matching how `phase` is
  already in-memory; the hash need not distinguish them (deep-linking mid
  cold-attempt is not a requirement). Set `mode` when the attempt starts,
  read it when saving. Do NOT invent a `cold` hash segment unless it earns
  its keep; if you do, keep it backward compatible with `warmup`.
- `App` loads the schedule alongside the latest attempt when a read screen
  opens (extend the existing async-on-open path). Reserve the schedule
  panel's layout while it loads so there is no jump.

### 4.2 Read screen: the schedule panel (`src/components/SchedulePanel.tsx`)
A new component rendered inside/under the read screen, given the loaded
`ScheduleEntry | null` and the speech. It never competes with the warm-up
for the single primary action (see §2 §7).

- **State `none`:** a subordinate panel headed like "Schedule a cold
  attempt", a short line on why (you speak it cold after a few days, when
  you have forgotten the words), the gap presets (2 days, 3 days, 1 week)
  as labelled controls, and, once a gap is chosen, an "Add to calendar"
  action that downloads the `.ics`. Choosing a gap writes the
  `ScheduleEntry` and moves to `waiting`. Warm-up remains the primary.
- **State `waiting`:** show the countdown (`aria-live="polite"`), keep the
  "Add to calendar" download available, and render the cold-attempt control
  as clearly closed (disabled with an accessible name like "Cold attempt
  opens in 2 days"). The warm-up stays the primary and fully usable. Offer
  a quiet way to change or clear the schedule.
- **State `ready`:** the cold attempt is the primary action now ("Start
  cold attempt"); starting it enters `reconstruct` with `mode = "cold"`.
  The warm-up drops to a secondary control. Completing the cold attempt
  marks the schedule `done`.
- **State `done`:** the schedule is spent; offer to schedule another cold
  attempt (back to `none`) while the archive holds the completed one.
- The countdown recomputes on a light interval (about once a minute is
  enough; a per-second tick is unnecessary and wasteful) and on
  `visibilitychange`/focus so it is correct when the tab returns. Clear the
  interval on unmount.

### 4.3 Reconstruct/study: save every attempt (update `App.tsx`)
- `handleStudy` writes a NEW attempt each time (unique id, `mode` from the
  current run) instead of overwriting. `markFirstRunDone` stays as is.
- After a save, if a previous attempt for this speech exists, surface a
  clearly labelled "Compare with your last attempt" control from the study
  view (this is the redo-shows-previous-beside-new path, see §4.5).
- Add a subordinate "Past attempts (N)" link from the read screen and/or
  the study view into the archive, where N is `countAttempts`. Hide or read
  "Past attempts" when N is 0.
- `restoreLatest` keeps working via the reimplemented `getLatestAttempt`.
- The `AlignmentSurface` differentiator contract is untouched: no `%`, no
  pass/fail, no per-word error styling, ever, including in compare.

### 4.4 Archive screen (`src/components/Archive.tsx`, view `archive`)
- Reached via `#/speech/:id/archive`. Header names the speech and states,
  in one positive line, what it holds ("Every reconstruction you record,
  saved on this device.").
- Renders the first page (cap 10) of `listAttempts` newest-first, with a
  load-more control that fetches the next page via the returned cursor.
  Each row: formatted timestamp, a mode label ("Warm-up" / "Cold"), and a
  short first-line snippet of the corrected transcript. The row is one
  keyboard-reachable control that opens that attempt's stored alignment in
  the study surface.
- Two attempts can be selected for compare (for example a "Compare" toggle
  on rows, capped at two). With two chosen, a "Compare selected" action
  opens the compare view.
- Empty state (no attempts for this speech): the designed positive copy
  above with a control to start a warm-up. Loading state: skeleton rows
  that hold layout.
- A back control returns to the read screen and/or library.

### 4.5 Compare view (`src/components/CompareAttempts.tsx`)
- Given two `Attempt`s (or one "current" plus the previous), render each on
  its own `AlignmentSurface`, each under a clear header naming which attempt
  it is by date and mode ("This attempt" / "Your last attempt, Sep 20").
- **Layout:** stacked single column at 390px (no horizontal scroll); two
  columns as a wide-viewport enhancement only. Reuse `AlignmentSurface`
  unchanged; pass each attempt's stored `alignment` and `originalLabel`
  (the speaker). Audio replay per attempt is optional; if shown, each
  surface plays its own stored audio.
- **No ranking, no diff-of-diffs, no aggregate.** The two surfaces sit
  together and the user reads them. Any UI that declares one attempt better
  is a differentiator failure.
- One-attempt state: a positive line explaining a second attempt is needed
  to compare, plus a control to record one. Never a broken compare.

### 4.6 SEED_DEMO / demo path (preserve prior behaviour)
- With `SEED_DEMO` (or `?demo=1`), the app still lands directly on the
  featured speech's populated sample alignment surface within a minute, no
  input, no schedule, no walk. The archive/schedule features do not alter
  the demo entry. Do not seed fake attempts or a fake schedule for the demo.

---

## 5. Ordered task list (each with acceptance criteria)

**T1 — Archive + schedule persistence (the migration).**
Bump `DB_VERSION` to 2. Stop keying attempts by `speech_id`; write unique
ids. Add the `by_speech_created` compound index and the `schedules` store
in `onupgradeneeded`. Add `listAttempts` (paginated cursor), `countAttempts`
(index count), `getAttempt`, and schedule read/write, all index- or
key-based. Add `mode` to `Attempt` and `ScheduleEntry` to `src/types.ts`.
*Done when:* unit tests (see §6, using `fake-indexeddb`) prove that two
attempts for one speech coexist without overwriting; a pre-v1 record
survives the upgrade and appears as that speech's oldest attempt;
`getLatestAttempt` returns the newest; `listAttempts` returns newest-first,
respects the page cap, and pages through with the cursor; `countAttempts`
matches; `getAttempt` fetches by id; schedules round-trip by `speech_id`;
and no archive read calls `getAll()` on the whole store (assert via the API
shape and a test that a large unrelated-speech population does not appear in
or slow a small speech's query).

**T2 — Schedule + `.ics` pure logic.**
Add `src/lib/schedule.ts` (`scheduleState`, `revealAtFromDays`,
`formatCountdown`, gap validation with MIN/MAX days) and `src/lib/ics.ts`
(`buildIcs`, download helper).
*Done when:* unit tests cover `scheduleState` across none/waiting/ready/done
with a fixed `now`; gap validation rejects sub-minimum and over-maximum
values; `formatCountdown` renders swept, em-dash-free strings; `buildIcs`
emits a valid `VCALENDAR`/`VEVENT` with `DTSTART` at the reveal, a unique
`UID`, CRLF endings, escaped text, and a copy-swept `SUMMARY`/`DESCRIPTION`
(no em-dash, no banned vocabulary, no "unlock").

**T3 — Schedule panel on the read screen.**
`SchedulePanel` renders the none/waiting/ready/done states, writes the
schedule on gap choice, offers the `.ics` download, shows the live
countdown (`aria-live`), and gates the cold attempt while keeping the
warm-up available. Read screen keeps ONE primary action at a time.
*Done when:* a component test shows: with no schedule, the presets and a
warm-up primary render and choosing a preset stores a schedule; in
`waiting`, the countdown and a closed cold-attempt control render while the
warm-up stays enabled and "Add to calendar" is present; in `ready`, the
cold attempt is the primary and starting it reports `mode = "cold"`; the
panel copy is positive and free of "unlock"/em-dashes.

**T4 — Save every attempt with mode + restore.**
`handleStudy` saves a new attempt (unique id, correct `mode`) each time
rather than overwriting; `restoreLatest` still restores the newest; the
cold attempt marks its schedule `done` on completion.
*Done when:* an E2E test does two warm-ups for one speech and both persist
(the archive shows two rows); the restore-on-reload behaviour still holds
(newest restored); after a scheduled reveal, completing the cold attempt
records a `cold` attempt and marks the schedule done (surfaced as the
`done` panel state).

**T5 — Archive screen + navigation.**
Add the `archive` view and `#/speech/:id/archive` route (update
`nav.ts`/`nav.test.ts`). `Archive` lists a capped, newest-first page with
load-more, a designed empty state, a loading skeleton, and rows that open a
stored attempt. Add "Past attempts (N)" entry points.
*Done when:* an E2E test reaches the archive from the read/study screen,
sees the saved attempts newest first, loads a second page when there are
more than the page cap, opens one attempt onto its stored alignment
surface, and (for a speech with no attempts) sees the designed positive
empty state with a working warm-up control; `parseHash`/`buildHash` unit
tests cover the archive route.

**T6 — Compare two attempts.**
`CompareAttempts` renders two attempts on stacked `AlignmentSurface`s
(single column at 390px). Redoing a speech offers "Compare with your last
attempt"; the archive lets the user pick any two and compare.
*Done when:* a component test renders two attempts side by side with
per-attempt headers (date + mode) and asserts the differentiator guard
holds in compare (no `%`, no pass/fail, no per-word error class, correct
speaker label on each original column); an E2E test redoes a speech and
opens the previous attempt beside the new one; the one-attempt state shows
the designed "record another to compare" copy, never a broken view.

**T7 — Designed states, mobile pass, README, copy sweep, existing tests.**
All new surfaces usable at 390px with no horizontal scroll and ~44px
targets; the schedule/archive/compare designed states are positive and in
voice; README updated for the spaced loop and archive with accurate
commands; mechanical copy sweep over every added/changed user-visible
string including the `.ics` text; existing unit/component/E2E suites pass
(update any that assumed a single overwritable attempt).
*Done when:* an E2E test at 390px asserts no horizontal scroll on the
schedule panel, archive, and compare views; the sweep finds no
em-dashes/en-dashes, no banned vocabulary, no "unlock", and no negative
empty-state phrasing in product-voice strings (verbatim speech text still
exempt); `npm test` and `./scripts/e2e.sh` both pass, including the updated
`restore.spec.ts` and any EPIC 1/2 spec touched by the multi-attempt change.

---

## 6. Test plan (each acceptance criterion → automated proof)

**Add `fake-indexeddb` as a devDependency** and import it in the db unit
test (or in `src/test/setup.ts` scoped to db tests) so IndexedDB logic runs
under Vitest/jsdom. This is the only way to prove indexing and pagination
deterministically without the browser. It is a dev dependency only; it adds
no runtime origin or bundle weight.

**Unit (Vitest):**
- DB archive (→ T1, AC3, AC5): two attempts per speech coexist; a seeded
  pre-v1 `{id: speechId}` record survives a v2 open and lists as oldest;
  `getLatestAttempt` newest; `listAttempts` newest-first, page-capped, and
  cursor-paged; `countAttempts` correct; `getAttempt` by id; populating many
  attempts for OTHER speeches does not appear in or enlarge one speech's
  page (index isolation, the fast-at-scale proof).
- DB schedule (→ T1, AC1): `saveSchedule`/`getSchedule` round-trip by
  `speech_id`; `markScheduleDone` flips status.
- Schedule logic (→ T2, AC1): `scheduleState` across none/waiting/ready/done
  at a fixed `now`; gap validation bounds; `formatCountdown` swept output.
- ICS (→ T2, AC2): `buildIcs` valid structure, reveal `DTSTART`, unique
  `UID`, CRLF, escaping; `SUMMARY`/`DESCRIPTION` copy-swept.
- Nav (→ T5): `parseHash`/`buildHash` cover the archive route and still
  round-trip library/read/warmup.

**Component (Vitest + Testing Library, jsdom):**
- SchedulePanel (→ T3, AC1, AC2): renders each state; choosing a preset
  stores a schedule and moves to waiting; waiting shows the countdown and an
  available warm-up plus add-to-calendar; ready makes the cold attempt
  primary; copy positive, no "unlock", no em-dash.
- Archive (→ T5, AC5): renders a page of rows with timestamp/mode/snippet;
  load-more requests the next page; empty state is positive; a row click
  invokes the open handler with the right id.
- Compare (→ T6, AC4): two attempts render on two alignment surfaces with
  per-attempt headers; differentiator guard (no `%`, no pass/fail badge, no
  per-word error class) holds; the one-attempt state renders its designed
  copy.
- Alignment differentiator guard (carried from prior EPICs) still passes.

**E2E (Playwright), transcription stubbed via `__E2E_TRANSCRIPT__`:**
- Spaced loop (→ AC1, AC2): open a speech, schedule a cold attempt, see the
  countdown, confirm the cold attempt is closed while the warm-up is still
  available, and download the `.ics` (assert the download fires with a
  `.ics` filename and `text/calendar` content). Use Playwright's clock
  (`page.clock`) to advance past `reveal_at` and confirm the cold attempt
  becomes available and, once completed, records a `cold` attempt. If
  `page.clock` proves unreliable against the app's timers, the unit
  `scheduleState` test is the primary gating proof and the E2E may instead
  seed a past-reveal schedule through the app's own storage path.
- Archive accumulation (→ AC3, AC5): complete two warm-ups for one speech,
  open the archive, see both newest-first; with more than the page cap,
  load-more reveals older ones; opening a row shows that attempt's stored
  alignment.
- Compare (→ AC4): redo a speech and open the previous attempt beside the
  new one; assert both alignment surfaces render and neither shows a `%` or
  pass/fail.
- Mobile (→ QUALITY BAR §2): at 390px, no horizontal scroll on the schedule
  panel, archive, and compare views.
- Restore (→ regression): the existing restore-on-reload E2E still passes
  against the multi-attempt store (newest restored).
- SEED_DEMO / demo (→ §4.6, carried): the demo still lands on the featured
  populated sample surface within a minute, no schedule, no walk.
- Header/isolation and no-upload E2E (carried): same-origin GETs only,
  `crossOriginIsolated === true`, headers intact. The `.ics` download is a
  local `blob:`/object URL, not a network request.

**Existing tests to update (part of T7):**
- `restore.spec.ts`: still valid (one attempt, newest restored); re-run
  against the new store and confirm it passes; extend or leave as is.
- Any spec or component test that assumed one overwritable attempt per
  speech: update to the append model. Preserve what each originally proved.

**Copy sweep (mechanical, part of T7 DONE):** grep every added/changed
user-visible string (schedule panel, presets, countdown, add-to-calendar,
`.ics` `SUMMARY`/`DESCRIPTION`, archive intro/empty/rows, compare headers
and one-attempt copy) for `—`, `–`, the banned vocabulary, the word
"unlock", and negative empty-state phrasing; fix every hit. Verbatim speech
`full_text`/`sentences[]`, titles, and author names stay exempt.

---

## 7. Notes, decisions, and exemptions
- **The migration is the risk; keep it forward-only.** Never delete or
  rewrite existing rows. Bumping to v2 and adding indexes over the existing
  store turns the one saved attempt into the archive's first entry for free.
  Do not attempt a data transform.
- **Recompute waiting/ready from the clock, persist only `done`.** A user
  who leaves the tab open across the reveal, or reloads after it, must see
  the cold attempt open without any background job. Storing `status` as the
  source of truth for waiting/ready would go stale.
- **`page.clock` for the gate transition, `scheduleState` unit test as the
  floor.** The pure gating function is the deterministic proof; the E2E
  clock test is the integration proof and may be softened to a seeded
  past-reveal if the timer interplay is flaky. Never ship the gate unproven.
- **Reuse the alignment engine and surface untouched.** Compare renders two
  existing alignments; it computes nothing new. Any real defect found while
  wiring gets the minimum fix plus a note, not a redesign.
- **Audio storage grows unbounded by design in this EPIC.** Every attempt
  keeps its optional audio. Pagination keeps the VIEWS fast (the acceptance
  criterion), but total on-device storage grows with use. Eviction/retention
  is explicitly out of scope; if testing shows it is a near-term problem,
  report it and raise a `requested_task`, do not build it here.
- **Export stays in EPIC 4.** This EPIC persists and displays the archive;
  writing it to a JSON/Markdown file is the next EPIC. The `.ics` is the
  only file this EPIC produces, and it is a reminder, not a data export.

## 8. Assumptions (flagged; none block the build)
- The planner's scope block for this EPIC was present and authoritative;
  this spec expands it directly. No blocking questions.
- Gap presets (2 days, 3 days, 1 week) and a 15-minute calendar event are
  chosen for a short daily rep; the implementer may adjust the exact preset
  set within the MIN/MAX-day bounds as long as every scheduled gap is
  genuinely multi-day (MIN 2 days).
- `fake-indexeddb` is assumed acceptable as a dev-only test dependency; it
  adds no runtime code or origin. If the implementer prefers to prove the
  archive purely through E2E in a real browser instead, that is acceptable
  provided every §6 DB unit criterion is proven somewhere and the
  index-not-scan guarantee is demonstrated.
