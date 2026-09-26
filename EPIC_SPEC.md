# EPIC SPEC — Speech library, reading, warm-up, and first run

## Quality differentiator (read this first)

**The alignment surface.** This product wins by turning the gap between
your spoken words and a master's into a neutral study object you examine,
never a score you fail. Delivery coaches grade how you sound; recitation
checkers punish any deviation. Franklin's Podium aligns your spoken
reconstruction to the original sentence by sentence, tolerant of
paraphrase, and shows the two side by side so you see the move you missed.

**What this demands of THIS EPIC:** the alignment engine and surface
already exist (EPIC 1). This EPIC's job is to make that surface *reachable
on day one for a real speech the user chose*, without a single wait. Every
new path added here (library, read screen, warm-up start) is plumbing that
delivers a user's sentences to the alignment surface faster and for more
than one speech. Do not touch, dilute, or duplicate the alignment
contract: no percentage, no pass/fail, no word-level red ink on a
rephrasing, ever, on any speech. Generalizing the surface from one speech
to several must not weaken it.

---

## 1. Scope

### In scope
Build the day-one value that exists *before* any multi-day wait, on top of
the EPIC 1 reconstruction loop:

1. **A curated public-domain speech library.** More than one speech,
   each with title, author, year, and a recorded public-domain basis. A
   library (home) screen lists them; tapping one opens it.
2. **The read/condense screen**, generalized from the current
   `SpeechScreen`: for the selected speech, show the full text and its
   one-line hint deck (the condensed "moves"), plus one obvious primary
   action to begin.
3. **The same-day warm-up reconstruction**, generalized from the current
   single-speech loop: from the read screen the user immediately records,
   transcribes on-device, corrects, and reaches the alignment surface for
   the speech they chose. Value exists the first day, before any wait.
4. **A guided first run that spans the new screens** (2 to 4 steps),
   anchored to the real controls, walking a brand-new user through
   completing one reconstruction, then never showing again.
5. **Designed empty, loading, and error states on every screen**, and
   **full usability at a 390px viewport** across every screen, new and
   existing.

### Out of scope (binding non-goals — do not build)
- **No schedule, enforced multi-day gap, countdown, reminder, or `.ics`
  file.** Every reconstruction in this EPIC is a same-day warm-up. The
  "cold attempt" gating is EPIC 3.
- **No archive UI and no compare-two-attempts view.** Persisting the
  single latest overwritable attempt per speech (already built) is the
  ceiling; do not add a history list, a per-speech archive screen, or any
  "previous vs new" surface.
- **No ledger / stolen-phrases saving**, and no save-a-phrase control on
  the alignment surface.
- **No paste-your-own-text mode and no hint extraction.** Hint decks are
  authored static data, shipped in the bundle.
- **No scores, grades, percentages, pass/fail, or word-level red ink**,
  anywhere, on any speech.
- **No accounts, no server storage, no network upload, no cloud
  transcription, no runtime LLM, no BYOK surface, no gateway calls.** The
  app stays fully client-side.
- **No new alignment algorithm work.** Reuse `align()`, `cleanTranscript`,
  and `segmentSentences` exactly as they are. If a genuine defect surfaces
  while wiring multiple speeches, fix the minimum and note it; do not
  redesign.
- **No search, filter, tag, sort, or favourite controls on the library.**
  A plain ordered list of the curated speeches is the whole surface.
- **No copyrighted speeches.** Every bundled speech is pre-1929 or a US
  government work, verified per speech, with its basis recorded in data.

---

## 2. Quality-bar obligations that land in THIS EPIC

The quality bar is spec. The clauses that bite here, made concrete:

- **Perceived speed (§1).** The library and read screens render instantly
  from bundled static data, with no dependency on the model download or
  any async fetch. First meaningful render of the library shows real
  speech cards within about 1 second. Navigating library → read → record
  gives feedback within 100ms (pressed states, immediate view change). The
  ASR/model code path stays dynamically imported (EPIC 1 already
  code-splits it); adding the library must not pull it into the initial
  chunk. The library is a small fixed list, so it needs no pagination; if
  the curated set ever grew large it would, but that is not this EPIC.
- **Mobile-first (§2).** Every screen fully usable at 390px: no horizontal
  scroll on the library, read, record, or study screens; touch targets
  (speech cards, primary buttons, back control) at least about 44px;
  readable without zoom. The alignment surface already stacks on narrow
  screens (EPIC 1); keep that.
- **Designed states (§3), per screen:**
  - *Library:* renders instantly from static data and is always
    populated, so no loading spinner or empty region ever shows. A short
    one-line intro tells a first-timer what the screen is for, in positive
    phrasing.
  - *Read screen:* if the requested speech id does not exist (a stale or
    hand-edited URL/hash), show a designed "choose a speech" state in the
    product's voice that routes back to the library. Never a blank screen
    or a thrown error.
  - *Reconstruct/study:* the EPIC 1 designed states (model-loading
    skeleton with determinate progress, microphone-denied,
    transcription-failed, no-speech-detected) carry over unchanged and
    must still work for whichever speech is selected.
- **First-run walk (§4).** See §4.4. A brand-new user is actively led
  through one full reconstruction across the new screens; skippable at any
  step; shown only until the first completed alignment; never again for a
  returning user.
- **Radically simple interface (§7).** The library gives each speech one
  tappable row and nothing competing. The read screen has ONE obvious
  primary action (start the warm-up); the full text sits behind a
  disclosure so the hint deck leads. Cut words: a speech row is title,
  author, year, not a paragraph.
- **Copy sounds human (§8).** Sweep every user-visible string you add or
  change (library intro, speech rows, read-screen buttons, walk steps,
  the not-found state, any new empty/error copy) for em-dashes/en-dashes,
  the banned LLM vocabulary, and negative empty-state phrasing before
  finishing. Speech `full_text`, `sentences[]`, author names, and titles
  are verbatim historical quotation and are EXEMPT (see §7); the hint
  decks and all UI chrome are product voice and ARE swept.
- **Accessibility (§6).** The library is a real list of links/buttons,
  keyboard reachable, each with an accessible name; visible focus states;
  the current screen has a proper `<h1>`; back navigation is a real
  control, not an icon with no label. Contrast meets the existing theme.
- **Security hygiene (§5).** No new server, no upload, no new external
  fetch. The CSP/COOP/COEP posture from EPIC 1 is unchanged; adding
  speeches adds only bundled JS/TS, no new origins. Do not add any
  runtime fetch. (There is still no untrusted input surface this EPIC:
  paste mode is out of scope.)
- **README (§9).** Update the README so it no longer claims "one speech"
  (it currently says the app ships only Gettysburg). A stranger must
  understand it now offers a small curated library, still run it with the
  verified commands, and find where speech data lives.

---

## 3. Technical design — navigation and structure

### 3.1 What exists (build on it, do not rebuild)
- `src/App.tsx` drives a single hardwired speech (`gettysburg`) through
  phases `record → transcribing → correct → study`, plus a demo path and
  a first-run walk keyed off `phase`.
- `src/components/SpeechScreen.tsx` renders one `Speech` (title, byline,
  hint deck as "The ten moves", full text behind `<details>`).
- `src/components/AlignmentSurface.tsx` renders pairs neutrally, stacks on
  mobile, has audio replay, and takes an `originalLabel` prop.
- `src/lib/db.ts` already keys the single overwritable attempt by
  `speech_id` (`getLatestAttempt(speechId)`, `saveAttempt` sets
  `id = speech_id`), so it already supports one saved attempt *per speech*
  with no schema change.
- `src/lib/env.ts` `isDemoEnabled()`, `src/data/sampleReconstruction.ts`,
  and the `SEED_DEMO` path exist for Gettysburg.
- The alignment/clean/segment engine (`src/align/*`) is pure and reused
  as-is.

### 3.2 Navigation model (smallest thing that works)
Introduce lightweight in-app view state; do NOT add react-router or a
state manager. Three views:

- `library` — the home list of curated speeches.
- `read` — the selected speech's read/condense screen.
- `reconstruct` — the existing `record → transcribing → correct → study`
  flow for the selected speech.

Requirements:
- Hold `view` and `selectedSpeechId` in `App` state. `reconstruct` reuses
  the existing `phase` state machine unchanged.
- **Deep-linkable and Back-friendly:** sync the current view to the URL so
  the browser Back button works and `SEED_DEMO`/`?demo=1` can deep-link.
  Use the URL **hash** (`#/`, `#/speech/:id`, `#/speech/:id/warmup`) so no
  nginx route rewriting is needed and the static host config from EPIC 1
  stays untouched. Read the hash on load, write it on navigation, and
  listen for `hashchange` so Back/Forward update the view. In-memory state
  remains the source of truth for the reconstruction phase; the hash only
  needs to distinguish the three views and the selected id.
- Navigating between views must not remount or re-download the model; the
  model code path stays dynamically imported and only loads when a
  reconstruction actually transcribes.
- Unknown speech id in the hash → render the read-screen "choose a speech"
  not-found state (§2) and offer a control back to the library.

### 3.3 Speech registry
- Add `src/data/speeches.ts` exporting:
  - `speeches: Speech[]` — the ordered curated list, Gettysburg included.
  - `getSpeech(id: string): Speech | undefined` — id lookup.
  - Optionally `featuredSpeechId` (default `"gettysburg"`) used by the
    demo/seed path.
- Each speech is its own module `src/data/<id>.ts` exporting a `Speech`,
  mirroring the existing `src/data/gettysburg.ts` shape. `gettysburg.ts`
  stays as is and is imported into the registry.
- `src/App.tsx` imports the registry, not individual speeches (except the
  featured one for the demo path if convenient).

### 3.4 Data model and persistence (forward-only, no migration)
- The `Speech` type in `src/types.ts` already carries every field the
  library needs (`title`, `author`, `year`, `source_url`,
  `public_domain_basis`, `full_text`, `sentences`, `hint_deck`). **No type
  change is required.**
- **Hint deck is NOT required to be 1:1 with sentences.** `sentences[]` is
  the alignment split (used by `align()`); `hint_deck[]` is the ordered
  set of one-line "moves" the user reads to reconstruct. For Gettysburg
  they happen to match (10 and 10); for a longer speech the deck may hold
  fewer hints than there are sentences. Keep each deck scannable (aim for
  roughly 8 to 15 one-line hints); this is why the curated set favours
  short orations.
- **IndexedDB is unchanged.** The store is keyed by `speech_id`, so
  multiple speeches already coexist as independent single-latest records.
  Do not bump `DB_VERSION`, do not add stores or indexes, do not add a
  list query (that is EPIC 3's archive). If you ever add an `Attempt`
  field, the store is schemaless so it is a non-breaking forward add, but
  this EPIC needs none.
- `first_run_done` stays a single `localStorage` flag (not per speech):
  the walk teaches the loop once across the whole product.

### 3.5 The curated speech set
Ship **at least 4 speeches total including Gettysburg** (recommended 5).
Every one MUST be pre-1929 or a US government work, verified per speech,
with `public_domain_basis` and a canonical `source_url` recorded in its
data module. Favour SHORT orations so a rep stays a ten-minute exercise
and the hint deck stays scannable.

**Recommended set (Gettysburg plus four). Substitute any entry with
another short, clearly pre-1929/US-government oration if you cannot
confirm a clean public-domain text; record whatever you actually ship:**

| id | title | author | year | public-domain basis |
|----|-------|--------|------|---------------------|
| `gettysburg` (shipped) | The Gettysburg Address | Abraham Lincoln | 1863 | Delivered 1863; US government work, published pre-1929. |
| `second-inaugural` | Second Inaugural Address | Abraham Lincoln | 1865 | Delivered 1865; US government work, published pre-1929. |
| `aint-i-a-woman` | Ain't I a Woman? | Sojourner Truth | 1851 | Speech delivered 1851; the widely published transcription appeared pre-1929, public domain. Record which published version you use. |
| `fight-no-more` | I Will Fight No More Forever | Chief Joseph | 1877 | Surrender speech recorded 1877; published pre-1929, public domain. |
| `right-to-vote` | On Women's Right to Vote | Susan B. Anthony | 1873 | Delivered 1873; published pre-1929, public domain. |

For each NEW speech module the implementer:
1. Sources verbatim public-domain text from a citable source, records the
   URL in `source_url`, and writes a one-line `public_domain_basis`.
2. Splits it into `sentences[]` for alignment (reuse the same manual
   split style as `gettysburg.ts`; do not depend on the runtime
   segmenter for the *original*).
3. Authors a `hint_deck[]` of ordered one-line "moves" in the same voice
   as the Gettysburg deck: each hint is one short imperative or
   descriptive line naming the move, not a quotation of the sentence.
4. **Runs the copy sweep on the hint deck** (em-dashes, en-dashes, banned
   vocabulary, negative phrasing). The verbatim speech text is exempt;
   the hints are not.

Do not author the new hint decks inside this spec; author them in the data
modules where they ship, so they are swept once in situ. The Gettysburg
deck in `src/data/gettysburg.ts` is the worked reference.

---

## 4. Technical design — screens

### 4.1 Library (home) screen — new `src/components/Library.tsx`
- Renders `speeches` as an ordered, keyboard-reachable list. Each row is
  ONE tappable control (button or link) with an accessible name, showing
  **title, author, and year**. Rows are at least ~44px tall.
- A single short intro line above the list states, in positive phrasing,
  what the screen is for (for example: "Pick a speech to rebuild from
  memory."). No wall of text.
- Selecting a row sets `selectedSpeechId`, navigates to `read`, and
  updates the hash.
- The list is static and always populated, so there is no loading or
  empty state to design; there must still never be a blank flash before
  the list paints (it comes from the bundle, so it paints on first
  render).
- Mobile: single-column at 390px, no horizontal scroll.

### 4.2 Read/condense screen — generalize `SpeechScreen`
- Continues to render the selected speech's title, byline
  (`author, year`), hint deck, and full text behind the `<details>`
  disclosure.
- **Generalize the hint-deck heading** away from the hardcoded "The ten
  moves" (decks vary in length now). Use a count-agnostic heading such as
  "The moves".
- Add ONE obvious primary action to begin the warm-up (for example
  "Start warm-up"), which navigates to `reconstruct` (phase `record`) for
  this speech.
- Add a clearly subordinate back control to return to the library ("All
  speeches" or "Back to the library").
- The read screen renders instantly from static data; no async, so no
  loading state. The only error state is the unknown-id not-found case
  (§2), which App handles before rendering this component.
- Keep the existing `SpeechScreen` accessibility (labelled section, real
  headings).

### 4.3 Reconstruct + study — generalize the existing flow
- The `record → transcribing → correct → study` machine is reused
  verbatim, parameterized by the **selected** speech instead of the
  imported `gettysburg`:
  - `align(spoken, selectedSpeech.sentences)` uses the selected speech.
  - `saveAttempt`/`getLatestAttempt` use `selectedSpeech.id` (already the
    keying scheme).
  - The `AlignmentSurface` `originalLabel` reflects the selected speaker
    (for example the author's name, or "The original" as a neutral
    fallback). Do not hardcode "Lincoln said" for other speeches.
- On entering the read screen for a speech, restore that speech's latest
  saved attempt if one exists (so a returning user can jump back to their
  last study surface for that speech), mirroring the EPIC 1 restore but
  scoped to the selected id. Keep this to the single overwritable record;
  do NOT build an attempt list.
- After a completed alignment or a "record again", the back control still
  returns to the library.
- All EPIC 1 designed states (model skeleton + determinate progress,
  mic-denied, transcribe-failed, no-speech) are preserved and work for the
  selected speech.

### 4.4 First-run walk across the library — update `FirstRunWalk`
- Extend the walk to span the new screens. 2 to 4 steps, each ONE short
  imperative sentence, anchored to the real controls the user will touch
  in order. Recommended four steps:
  1. Pick a speech.
  2. Read the moves.
  3. Record your version.
  4. Study the pairs.
- Derive `activeStep` from the current `(view, phase)`:
  - `library` → step 1 active.
  - `read` → step 2 active.
  - `reconstruct` in `record`/`transcribing`/`correct` → step 3 active.
  - `reconstruct` in `study` → step 4 active.
- Skippable at any step (the existing Skip control sets `first_run_done`
  and hides the walk).
- Appears only until the first completed alignment. Completing one
  reconstruction sets `first_run_done` (already wired in `handleStudy`);
  after that the walk never renders again, including across reloads and
  across speeches.
- A returning user (flag set) never sees it on any screen. The demo/seed
  path must not show the walk (it already suppresses it via `isSample`).
- Do not build EPIC 3+ concepts into the walk (no scheduling step).

### 4.5 SEED_DEMO / demo path (preserve EPIC 1 behaviour)
- With `SEED_DEMO` truthy (or `?demo=1`), the app still lands directly on
  the **featured speech's** populated alignment surface within a minute,
  no input required, using the bundled `sampleReconstruction` against
  Gettysburg. Set `selectedSpeechId` to the featured id and go straight to
  the sample study view, exactly as today. The library need not be shown
  first in demo mode.
- Only the featured speech needs a bundled sample. Do not author sample
  reconstructions for the other speeches (out of scope; the demo
  requirement is one populated surface with a visible gap).
- Keep the sample non-empty with at least one visible gap (the EPIC 1
  contract).

---

## 5. Ordered task list (each with acceptance criteria)

**T1 — Speech registry + curated data modules.**
Add `src/data/speeches.ts` (`speeches`, `getSpeech`, `featuredSpeechId`)
and at least three new `src/data/<id>.ts` modules (recommended set in
§3.5), each a valid `Speech` with verbatim public-domain text,
`sentences[]`, an authored `hint_deck[]`, a recorded `public_domain_basis`
and `source_url`.
*Done when:* the registry lists at least 4 speeches including Gettysburg;
every speech is pre-1929 or a US government work with its basis recorded
in data; a unit test asserts each speech has non-empty `title`, `author`,
numeric `year`, non-empty `sentences[]` and `hint_deck[]`, a recorded
`public_domain_basis`, and (guard) that its `hint_deck` contains no `%`
and no banned phrasing.

**T2 — Library (home) screen.**
`src/components/Library.tsx` renders the registry as an accessible,
keyboard-reachable list of rows showing title, author, year, each row a
single control that selects the speech. Positive one-line intro. Usable at
390px with no horizontal scroll.
*Done when:* a component test renders all curated speeches with their
title/author/year and confirms selecting a row invokes the select
callback with the right id; the intro copy is positive (no "no speeches
yet" style text); rows meet the ~44px target.

**T3 — Navigation and view state.**
`App` holds `view` (`library | read | reconstruct`) and
`selectedSpeechId`, synced to the URL hash (`#/`, `#/speech/:id`,
`#/speech/:id/warmup`), with `hashchange` wired so Back/Forward work.
Unknown id renders the not-found state routing back to the library.
*Done when:* an E2E test navigates library → read → record → study by
clicking real controls; the browser Back button returns to the prior
view; deep-linking a valid `#/speech/:id` opens that speech's read screen;
deep-linking an unknown id shows the designed not-found state with a
working control back to the library; the ASR chunk is still absent from
the initial JS.

**T4 — Read/condense screen with warm-up start.**
Generalize `SpeechScreen`: count-agnostic hint-deck heading, one primary
"start warm-up" action into `reconstruct`, a subordinate back-to-library
control. Renders any selected speech from static data instantly.
*Done when:* a component test renders a non-Gettysburg speech's title,
byline, hint deck, and full text; the primary action fires the
start-warm-up callback; a back control fires the back callback; no async
model dependency on mount.

**T5 — Reconstruct/study generalized to the selected speech.**
The existing loop aligns against `selectedSpeech.sentences`, saves/loads by
`selectedSpeech.id`, and labels the original column by the selected
speaker. Latest attempt restores per speech.
*Done when:* an E2E test (transcription stubbed via `__E2E_TRANSCRIPT__`)
completes a warm-up for a NON-Gettysburg speech and reaches a populated
alignment surface labelled with that speaker; a second visit to that
speech restores its saved attempt; the alignment surface still shows no
`%`, no pass/fail, no word-diff error styling (differentiator guard
preserved).

**T6 — First-run walk across screens.**
Update `FirstRunWalk` steps and `App`'s `activeStep` derivation to span
library → read → record → study; skippable; shown only until the first
completed alignment; never again.
*Done when:* an E2E test on a fresh profile sees the walk on the library
screen, sees the active step advance as it moves through the flow,
completes one alignment, and confirms the walk is gone and stays gone
after a reload and when opening a different speech; a fresh profile that
clicks Skip also never sees it again.

**T7 — Designed states + mobile pass on the new screens.**
Library intro and the read-screen not-found state are designed in the
product's voice and positive; every new screen is usable at 390px with no
horizontal scroll and ~44px targets; EPIC 1 designed states still work per
selected speech.
*Done when:* an E2E test at 390px asserts no horizontal scroll on the
library, read, record, and study screens; the not-found state renders
designed copy (not a blank or raw error) with a working back-to-library
control; existing mic-denied/transcribe-failed/no-speech component tests
still pass.

**T8 — README + copy sweep + update existing tests.**
Update the README so it describes a small curated library (not "one
speech"), keeps the verified run/dev/test commands, and points to
`src/data/` for speech data. Update the EPIC 1 E2E tests that assumed a
single screen at `/` (see §6). Mechanical copy sweep over every
user-visible string added or changed.
*Done when:* the README no longer claims a single speech and its commands
still match the actual compose/Dockerfile; the full test suite
(`npm test` and `./scripts/e2e.sh`) passes; the sweep finds no
em-dashes/en-dashes, banned LLM vocabulary, or negative empty-state
phrasing in product-voice strings (speech text and titles exempt).

---

## 6. Test plan (each acceptance criterion → automated proof)

**Unit (Vitest):**
- Registry integrity (→ T1): every speech has non-empty title/author,
  numeric year, non-empty `sentences[]` and `hint_deck[]`, a recorded
  `public_domain_basis` and `source_url`, and a unique `id`.
- Public-domain guard (→ T1): every speech's `year` is < 1929 OR its
  `public_domain_basis` explicitly records a US-government-work basis.
- Copy-sweep guard on hint decks (→ T1, §8): no hint contains `—`, `–`,
  `%`, the banned vocabulary, or negative empty-state phrasing.

**Component (Vitest + Testing Library, jsdom):**
- Library (→ T2): renders every curated speech with title/author/year;
  clicking a row calls the select handler with that speech's id; the
  intro line is present and positive.
- Read screen (→ T4): renders a non-Gettysburg speech's title, byline,
  hint deck, and full text with no async dependency; primary action and
  back control fire their callbacks.
- Alignment surface differentiator guard (→ T5, carried from EPIC 1):
  given a fixed `AlignmentPair[]`, the DOM contains no `%`, no pass/fail
  badge, no per-word error highlight class, and the original column uses
  the passed-in speaker label.
- First-run walk (→ T6): renders the correct active step for each
  `(view, phase)`; hidden when `first_run_done` is set; Skip hides it and
  sets the flag.
- Existing designed-state tests (mic-denied, transcribe-failed,
  no-speech) still pass unchanged (→ T7).

**E2E (Playwright), transcription stubbed via `__E2E_TRANSCRIPT__`:**
- Library-to-study happy path (→ T3, T5): from `/`, click a speech, read,
  record (stubbed transcript), proceed through correction, reach a
  populated alignment surface for the chosen speech.
- Non-Gettysburg loop (→ T5): run the happy path for a second speech and
  assert the original column is labelled with that speaker and the surface
  has no `%`/pass-fail/red-ink.
- Navigation and deep-link (→ T3): Back button returns to the prior view;
  a valid `#/speech/:id` deep-link opens that read screen; an unknown id
  shows the not-found state with a working back control.
- First-run walk across screens (→ T6): fresh profile sees the walk on the
  library, the active step advances through the flow, and after one
  completed alignment the walk is gone and stays gone across a reload and
  when opening another speech.
- Restore per speech (→ T5): after completing a warm-up, reloading and
  reopening that speech restores its saved attempt/study surface.
- Mobile (→ T7): at 390px, no horizontal scroll on the library, read,
  record, and study screens.
- SEED_DEMO / demo (→ §4.5, carried from EPIC 1): with the demo flag on,
  the featured speech's populated alignment surface renders within a
  minute with a visible gap and no manual input, and the walk does not
  show.
- Header/isolation and no-upload E2E from EPIC 1 (→ §5 security) still
  pass unchanged: same-origin GETs only, `crossOriginIsolated === true`,
  header set intact.

**Existing tests to update (part of T8):**
- `e2e/first-run-walk.spec.ts` currently expects the Gettysburg heading at
  `/`. With `/` now the library, update it to expect the library screen,
  then drive the walk across the new navigation.
- Any EPIC 1 E2E spec that assumed the single reconstruction screen sat
  directly at `/` (for example `first-render`, `record-flow`, `mobile`)
  must navigate through the library → read → record first. Preserve what
  each originally proved (fast first render, the record flow reaching
  study, no horizontal scroll); only adjust the entry navigation.
- `demo.spec.ts` must still pass; adjust only if the demo entry path
  changed.

**Copy sweep (mechanical, part of T8 DONE):** grep every user-visible
string added or changed for `—`, `–`, the banned vocabulary, and negative
empty-state phrasing; fix hits. New speeches' `full_text`/`sentences[]`,
titles, and author names are exempt as verbatim historical quotation; the
hint decks and all UI chrome are swept.

---

## 7. Notes, decisions, and exemptions

- **Verbatim historical text is exempt from the copy sweep.** Each
  speech's `full_text`, `sentences[]`, `title`, and `author` reproduce
  public-domain source material and must not be "corrected" (this is why
  Gettysburg keeps its em-dashes). Hint decks and every UI string are
  product voice and ARE swept.
- **No IndexedDB migration.** The store already keys attempts by
  `speech_id`, so multiple speeches coexist with no schema change. Keep
  `DB_VERSION` at 1. The archive/list is EPIC 3; do not add a list query
  or index here.
- **Reuse the alignment engine untouched.** `align`, `cleanTranscript`,
  and `segmentSentences` are correct and tested; this EPIC only feeds them
  a chosen speech's sentences. Any real defect found while wiring gets the
  minimum fix plus a note, not a redesign.
- **Warm-up only.** Every reconstruction here is a same-day warm-up. Do
  not add mode flags, scheduling, countdowns, or a `cold` path; EPIC 3
  owns those.
- **Hint decks may be shorter than the sentence list** for longer
  speeches (§3.4). Keep each deck scannable and favour short orations so
  the rep and the deck both stay small.
- **Transcription-fidelity finding (carried from EPIC 1 / VALIDATION
  constraint 2):** if, while testing warm-ups on the new speeches, a large
  share of flagged gaps trace to transcriber errors rather than the
  speaker, report it in `result.json` `summary` and raise a
  `requested_task` for the typed-reconstruction fallback. Do NOT build the
  typed fallback here (out of scope).

## 8. Assumptions (flagged; none block the build)
- The planner's scope block for this EPIC was present and authoritative;
  this spec expands it directly. No blocking questions.
- The recommended curated speech set (§3.5) is a starting point chosen for
  clear public-domain provenance and short length; the implementer may
  substitute any speech that meets the pre-1929/US-government rule and must
  record whatever is actually shipped. The only hard requirements are: at
  least 4 speeches total including Gettysburg, and every one verified
  public-domain with its basis in data.
- Hash-based navigation is chosen so the EPIC 1 static-host header config
  needs no route-rewriting change; if the implementer prefers History-API
  routing they must add nginx SPA fallback without weakening the CSP/COOP/
  COEP set, and prove the header E2E still passes.
