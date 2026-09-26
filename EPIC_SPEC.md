# EPIC SPEC — Stolen-phrases ledger, paste-your-own, and export

## Quality differentiator (read this first)

**The alignment surface.** This product wins by turning the gap between
your spoken words and a master's into a neutral study object you examine,
never a score you fail. Delivery coaches grade how you sound; recitation
checkers punish any deviation. Franklin's Podium aligns your spoken
reconstruction to the original sentence by sentence, tolerant of
paraphrase, and shows the two side by side so you see the move you missed.

**What this demands of THIS EPIC:** two of the four criteria touch the
alignment surface directly, so they are held to the differentiator, not
just the baseline bar.

- **Save-to-ledger lives ON the alignment surface.** The one-tap "keep"
  control must read as "this line is worth stealing", never as "you got
  this line wrong". It is an additive, positive affordance on the
  original (the master's) side of a pair. It MUST NOT introduce a score,
  a count of "missed" lines, a pass/fail badge, or per-word red ink, and
  it MUST NOT change the neutral framing of the surface. A ledger that
  turns the study surface into a scorecard is a differentiator failure
  even if every test passes.
- **Paste-your-own runs the SAME surface.** Pasted text reaches the exact
  same meaning-tolerant alignment surface, with the same neutral framing.
  The only difference is the original column is labelled as the user's own
  text, not a named author. No new alignment algorithm, no scoring for
  pasted material.

---

## 1. Scope

This EPIC adds the product's second durable artifact (the ledger of
stolen phrases) and the modern-material path (practice your own text),
plus data export. It builds directly on the EPIC 1 reconstruction loop,
the EPIC 2 library and read screen, and the EPIC 3 archive/schedule
store. It reuses `align()`, `cleanTranscript()`, `segmentSentences()`,
and `AlignmentSurface` unchanged.

### In scope

1. **Save a phrase to the ledger (AC1).** From any alignment pair that has
   an original line, one tap keeps that line to the ledger, tagged with
   its source (the speech, or the user's own pasted text). The control
   shows kept/not-kept state and toggles, so a second tap removes it. This
   works everywhere the alignment surface renders: the live study view,
   an opened archived attempt, and each pane of the compare view.

2. **The ledger screen (AC2).** A new top-level screen at `#/ledger` lists
   every kept line, grouped by its source. Each group is headed by the
   source title. Each row shows the kept line and its saved date, with a
   remove control. A designed, positive empty state tells a first-time
   user exactly how to add the first line. The list is index-backed and
   paginated (capped page plus load-more), never an unbounded render.

3. **Paste-your-own-text mode (AC3).** A new screen at `#/paste` accepts
   pasted text. The input is size-capped and treated strictly as text
   (never HTML). On submit the app extracts a one-line-per-sentence hint
   deck **deterministically with no LLM**, stores the pasted text as a
   local practice source, and drops the user into the same
   read → warm-up → transcribe → correct → align → study → archive loop
   the curated speeches use. Kept lines from a pasted source tag to that
   source in the ledger.

4. **Export (AC4).** A new screen at `#/settings` writes the archive (all
   attempts) and the ledger (all kept lines) to a JSON file and to a
   Markdown file, each offered as a local download. It also carries the
   plain statement that nothing leaves the device.

### Out of scope (binding non-goals — do not build)

- **No cloud sync, no server, no accounts, no upload.** Fully
  client-side, exactly as today. The only artifacts leaving the app are
  files the user downloads to their own machine (the export files, and
  the EPIC 3 `.ics`).
- **No sharing or import from other users.** Export is a one-way
  download of the user's own data. Do NOT build an import/restore path,
  a share link, or any read of another user's file. (Re-importing an
  exported file is a plausible future task; raise it via
  `requested_tasks`, do not build it here.)
- **No LLM-generated hints for pasted text.** Hint extraction is
  mechanical and deterministic. No BYOK surface, no gateway call, no
  runtime LLM anywhere. The pasted-text hint is a cue derived from the
  sentence itself, never a paraphrase produced by a model.
- **No scores, grades, percentages, pass/fail, streaks, or word-level
  red ink**, anywhere, including on pasted-text alignments and including
  the ledger. The ledger counts nothing about performance.
- **No note editor on ledger items.** The `LedgerItem.note` field is
  reserved in the type for forward-compatibility, but this EPIC ships no
  UI to write or edit a note. Adding one is drift.
- **No new alignment algorithm and no changes to the alignment engine.**
  Pasted text is segmented and aligned with the existing functions.
- **No changes to the EPIC 2 first-run walk.** The walk teaches the
  curated warm-up loop and ends at the first alignment. Do not add a
  ledger, paste, or export step to it.
- **No scheduling requirement for pasted sources.** The spaced cold-attempt
  mechanism is EPIC 3 and is not a criterion here. See §4.4 for how the
  read screen is reused.
- **No audio in the export.** Attempt audio blobs stay on the device and
  are not written to the JSON or Markdown files. The export is the text
  record (transcript, alignment, ledger).

---

## 2. Quality-bar obligations that land in THIS EPIC

The quality bar is spec. The clauses that bite here, made concrete:

- **Perceived speed (§1).**
  - Ledger reads MUST be index-backed. Grouping by source uses a compound
    index range scan, never `getAll()` on the whole store filtered in JS.
    A ledger of hundreds of lines across many sources must not slow the
    view of a source with three kept lines.
  - The ledger screen is paginated: a fixed page cap (default 30) plus a
    load-more control. It never renders an unbounded list.
  - Tapping keep/remove gives feedback within 100ms (optimistic toggle of
    the control's state; the IndexedDB write happens in the background).
  - Extracting a hint deck from pasted text is synchronous, in-memory, and
    deterministic; for the size-capped input it completes well within
    100ms with no spinner. If it ever exceeded that, show inline progress,
    but the size cap keeps it instant.
  - Building and downloading the export runs off a deliberate button press;
    it reads all stores once (not a hot path) and builds the files
    in-memory. Give a pressed/working state on the button so the press is
    acknowledged within 100ms.
  - The new screens must not pull the ASR/model chunk into the initial
    bundle. It stays dynamically imported exactly as today.

- **Mobile-first (§2).** Every new surface fully usable at 390px with no
  horizontal scroll: the ledger (grouped list), the paste screen
  (textarea and its controls), the settings/export screen, and the keep
  control on the alignment surface. Touch targets (keep toggle, remove,
  load-more, extract, export buttons, nav links) at least ~44px. The keep
  control sits within each pair without forcing the pair to overflow at
  390px; the alignment surface stays single-column on mobile as today.

- **Designed states (§3), per surface:**
  - *Ledger:* a designed, positive empty state (a first-time user sees
    what the screen is for and the exact way to add the first line, in
    positive voice); a loading state that holds layout (skeleton rows, not
    a white gap) while the first page reads; the grouped list otherwise.
  - *Paste:* an empty state that shows what to do (a labelled textarea
    with a real example placeholder, one obvious primary action); a
    designed error when the text is too long or too short, in the
    product's voice with what to do next (never a raw limit dump or a dead
    end); a brief working state while the source is stored and the deck
    built.
  - *Settings/export:* if there is nothing to export yet (no attempts and
    no ledger), the export controls say so positively and point the user
    at recording a first reconstruction, rather than downloading an empty
    file. Otherwise the two download actions plus the privacy statement.
  - The keep control has a clear kept vs not-kept state; when the ledger
    has zero items the surface still works (keep just adds the first).
  - EPIC 1/2/3 states carry over unchanged.

- **Radically simple interface (§7).** Each new screen has ONE obvious
  primary action. Paste: the textarea and its single "find the moves"
  action; secondary is back. Settings: the export actions are the point;
  the privacy line is a short statement, not an essay. The ledger row is a
  kept line plus its date and a quiet remove control, not a paragraph. The
  keep control is a short label or a labelled icon, not a sentence. Cut
  words. Prefer the example placeholder in the paste box over instructions.

- **Copy sounds human (§8).** Sweep every user-visible string you add or
  change: the keep control (kept and not-kept labels and their accessible
  names), the ledger heading/intro/empty-state/rows/remove, the paste
  heading/placeholder/primary action/error messages, the settings heading,
  privacy statement, export button labels, the export files' own static
  labels and headings (the Markdown export headings and the JSON key
  labels the user reads ARE product voice), and any new nav links. Ban
  em-dashes and en-dashes, the banned LLM vocabulary, negative empty-state
  phrasing, and the word "unlock". Empty and error states say what IS and
  what to DO. Verbatim speech text, author names, and the user's own
  pasted text are exempt (never rewrite the user's paste or a quotation).

- **Accessibility (§6).** The keep toggle is a real button with an
  accessible name that includes its state (for example "Keep this line" /
  "Remove this line from your ledger") and a visible focus state; toggling
  it announces the change (`aria-pressed` reflects kept state). The ledger
  is a real list with a heading per source group and keyboard-reachable
  rows and remove controls. The paste textarea has an associated label.
  The export buttons are labelled. Every new screen has a proper
  `<h1>`/`<h2>` structure and visible focus states. Nav links are reachable
  by keyboard.

- **Security hygiene (§5).** No new server, no upload, no new external
  fetch, no new origin. Pasted text is validated at the boundary: it is
  size-capped (reject over the cap with a designed message) and handled as
  a plain string, never rendered as HTML (no `dangerouslySetInnerHTML`; the
  stored `text` and derived `sentences`/`hints` are React text nodes).
  Export files are built in-memory and offered as `Blob` downloads; they
  never round-trip a server. The CSP/COOP/COEP posture from EPIC 1 is
  untouched. No PII in logs; do not log pasted text.

- **README (§9).** Add the ledger, paste-your-own, and export to the "how
  it works" description: keep the best lines you find in a ledger grouped
  by source, practice against your own pasted text with the same loop, and
  download your archive and ledger as JSON or Markdown files you keep. Keep
  the run/dev/test commands accurate. Point at where the new code lives
  (`src/lib/hints.ts` for deterministic hint extraction, `src/lib/export.ts`
  for the export files, `src/lib/db.ts` for ledger and user-text storage,
  `src/components/Ledger.tsx`, `src/components/PasteScreen.tsx`,
  `src/components/Settings.tsx`). No pipeline internals.

---

## 3. Technical design — data model and persistence

### 3.1 What exists (build on it, do not rebuild)

- `src/lib/db.ts` opens `franklins-podium` at `DB_VERSION = 2` with two
  stores: `attempts` (keyPath `id`, compound index `by_speech_created` on
  `["speech_id", "created_at"]`) and `schedules` (keyPath `speech_id`).
  Reads are index- or key-based; the migration guard rejects when
  `indexedDB` is undefined so jsdom degrades instead of throwing.
- `saveAttempt` writes a unique `id` (`crypto.randomUUID()`); two attempts
  per speech coexist. `listAttempts`, `countAttempts`, `getAttempt`,
  `getLatestAttempt` are all index- or key-backed and paginated where they
  return lists.
- `src/types.ts` defines `Speech`, `AlignmentPair`
  (`{ spoken, original, relation }`), `Attempt` (with `mode`), and
  `ScheduleEntry`.
- `src/data/speeches.ts` exposes the curated library and
  `getSpeech(id)` (synchronous map lookup).
- `src/App.tsx` resolves `selectedSpeech = getSpeech(selectedSpeechId)`
  synchronously and drives the record → transcribe → correct → study loop,
  saving each attempt keyed by `speech_id`.
- `AlignmentSurface` is presentational: it takes `pairs`, `audioUrl`,
  `originalLabel`. It writes nothing.

### 3.2 Forward-only migration (`DB_VERSION` 2 → 3)

Bump `DB_VERSION` to `3`. In the SAME `onupgradeneeded`, create two new
stores; never touch or rewrite `attempts` or `schedules`.

- **`ledger` store**, keyPath `id`.
  - Compound index `by_speech_saved` on `["speech_id", "saved_at"]`. This
    is the workhorse: the ledger screen scans it clustered by source (so
    grouping is a contiguous cursor pass), and the per-source saved-state
    lookup for the alignment surface is a bounded range scan on one
    `speech_id`. No full-store scan, no `getAll()` on a hot path.
- **`user_texts` store**, keyPath `id`. Primary-key lookup only; no index
  needed (a pasted source is opened by its exact id).

Guard IndexedDB access exactly as today. Existing `attempts` and
`schedules` rows survive untouched; the new stores start empty.

### 3.3 Type changes (`src/types.ts`)

Add, forward-additive:

```ts
export interface LedgerItem {
  id: string;          // crypto.randomUUID()
  phrase: string;      // the original (master's) line kept, verbatim
  speech_id: string;   // source id: a curated speech id, or a "paste:<uuid>" id
  source_title: string; // denormalized at save time for grouping and export
  note?: string;       // reserved; no editor ships in this EPIC
  saved_at: number;    // epoch ms
}

export interface UserText {
  id: string;          // "paste:<uuid>"
  title: string;       // deterministic, derived from the opening words
  text: string;        // the pasted text, stored as a plain string
  sentences: string[]; // segmentSentences(text)
  hints: string[];     // one deterministic cue per sentence, same length/order
  created_at: number;  // epoch ms
}
```

`source_title` is denormalized so the ledger groups and the export read
without loading every source. No rename feature exists, so it cannot go
stale. `speech_id` is the stable grouping key; display uses `source_title`.

### 3.4 New `db.ts` API (all index- or key-based)

Ledger:
- `saveLedgerItem(item: LedgerItem): Promise<void>` — `put` by `id`.
- `removeLedgerItem(id: string): Promise<void>` — `delete` by `id`.
- `listLedgerBySpeech(speechId: string): Promise<LedgerItem[]>` — bounded
  range scan on `by_speech_saved` for one `speech_id`, used to hydrate the
  keep-state of the current source's alignment surface. Bounded by how many
  lines the user kept for one source (small).
- `listLedger(opts?: { limit?: number; after?: [string, number] | null }): Promise<{ items: LedgerItem[]; nextCursor: [string, number] | null }>`
  — a capped page (default 30) from a cursor over `by_speech_saved`, so
  items arrive clustered by `speech_id`. `nextCursor` is the compound key
  to continue from. This is the paginated, index-backed ledger read.
- `countLedger(): Promise<number>` — index `count()` over the whole store,
  used to decide the export empty state and any "Ledger (N)" affordance.
  (Optional; the first `listLedger` page also reveals emptiness.)

User texts:
- `saveUserText(t: UserText): Promise<void>` — `put` by `id`.
- `getUserText(id: string): Promise<UserText | null>` — primary-key `get`.

Export (deliberate, not a hot path — reading all rows here is acceptable):
- `readAllForExport(): Promise<{ attempts: Attempt[]; ledger: LedgerItem[]; userTexts: UserText[] }>`
  — one cursor pass per store. Strip each attempt's `audio_blob` before
  returning (audio never leaves the device in the export).

Keep every list read paginated or bounded and every point read key-based.
A review WILL check that the ledger screen does not `getAll()` the whole
store and filter in JS.

### 3.5 Deterministic hint extraction (`src/lib/hints.ts`, pure)

No LLM. All functions are pure and unit-testable.

- Constants: `PASTE_MAX_CHARS = 10000`, `PASTE_MIN_CHARS = 40`.
- `validatePaste(text: string): { ok: true } | { ok: false; reason: "too-long" | "too-short" }`
  — trims, checks against the bounds. Reject rather than silently
  truncate.
- `extractDeck(text: string): { sentences: string[]; hints: string[] }`:
  - Normalize newlines and runs of whitespace to single spaces (this is
    source text, so do NOT run the spoken-transcript filler cleanup on it).
  - `sentences = segmentSentences(normalized)` (reuse
    `src/align/segment.ts` unchanged).
  - For each sentence, derive ONE deterministic cue: take the leading
    clause up to the first `,` `;` or `:`, or the first `HINT_WORDS` words
    (define `HINT_WORDS = 8`), whichever is shorter; trim; strip trailing
    terminal punctuation; append an ellipsis when the cue is shorter than
    the sentence. The result is one line. `hints[i]` cues `sentences[i]`;
    the arrays are the same length and order.
  - This cue is a memory prompt drawn from the sentence itself, never a
    paraphrase. Do not dress it up as an authored hint.
- `deriveTitle(text: string): string` — the first ~6 words of the first
  sentence, trimmed, trailing punctuation removed; fall back to a fixed
  positive default (for example "Your text") when the paste has no usable
  words. Deterministic.

### 3.6 Export builders (`src/lib/export.ts`, pure builders + download helper)

- `buildExportJson(data): string` — a stable, pretty-printed JSON string:
  ```
  {
    "app": "Franklin's Podium",
    "exported_at": <ms>,
    "attempts": [
      { "source_id", "source_title", "mode", "created_at",
        "corrected_transcript", "alignment": [{ "spoken", "original", "relation" }] }
    ],
    "ledger": [
      { "phrase", "source_id", "source_title", "saved_at" }
    ],
    "your_texts": [
      { "id", "title", "text", "created_at" }
    ]
  }
  ```
  `source_title` for a curated attempt is resolved from `getSpeech`; for a
  user source it is the `UserText.title`. Audio is never included. Ordering
  is deterministic (by source, then by time) so exports are stable and
  diffable.
- `buildExportMarkdown(data): string` — a human-readable document the user
  keeps: a top heading, a "Your ledger" section grouped by source (each
  group headed by its title, each kept line as a list item with its date),
  and a "Your attempts" section grouped by source, each attempt showing its
  date and mode and its aligned pairs rendered readably (your line beside
  the original line). Static headings and labels are product voice: sweep
  them. `exported_at` is passed in from the caller (the component supplies
  `Date.now()`), so the builder stays pure and testable with a fixed value.
- A small download helper offers a string as a `Blob` of the right type
  (`application/json` / `text/markdown`) via a temporary object URL, then
  revokes it. Reuse the same shape as the EPIC 3 `.ics` download helper;
  it touches no network.

Filenames: `franklins-podium.json` and `franklins-podium.md`.

---

## 4. Technical design — navigation and screens

### 4.1 Navigation (extend `src/lib/nav.ts`, do not add a router)

Add three top-level views. Hash routes:
- `#/ledger` → the ledger (NEW)
- `#/paste` → paste-your-own entry (NEW)
- `#/settings` → settings and export (NEW)
- Existing `#/`, `#/speech/:id`, `#/speech/:id/warmup`,
  `#/speech/:id/archive` are unchanged, and `:id` now also accepts a
  `paste:<uuid>` source id (already handled: it is `encodeURIComponent`'d
  in `buildHash` and decoded in `parseHash`).

`View` gains `"ledger" | "paste" | "settings"`. Keep `parseHash`/`buildHash`
pure; extend `nav.test.ts` to round-trip the new routes and confirm a
`paste:<uuid>` speech id survives encode/decode.

Add a small, keyboard-reachable top nav (in the masthead) with links to the
library, the ledger, and settings, plus an entry to paste-your-own from the
library screen. Keep it to short text links, ~44px targets, one clear set.
Do not build a heavy nav component.

### 4.2 Save-to-ledger on the alignment surface (`src/components/AlignmentSurface.tsx`)

Extend the presentational surface with optional keep support, so it stays
presentational and all writes stay in `App`:

- New optional props: `keptPhrases?: Set<string>` (the originals already in
  the ledger for this source) and
  `onToggleKeep?: (phrase: string) => void`.
- When `onToggleKeep` is provided, render a keep toggle on each pair that
  HAS an `original` (that is, `relation` is `aligned` or `original-only`;
  a `spoken-only` pair has no original to keep, so no control). Pairs with
  no original show no keep control.
- The toggle is a real button, `aria-pressed` reflecting
  `keptPhrases.has(pair.original)`, with a state-bearing accessible name.
  Clicking calls `onToggleKeep(pair.original)`.
- When `onToggleKeep` is absent (for example a context that should not
  write), no keep control renders. The surface's existing output is
  otherwise unchanged.
- The differentiator contract is untouched: no `%`, no pass/fail, no
  per-word error styling, no "missed" count. The keep control is additive
  and positive only.

`App` owns the wiring:
- When a source's study view, an opened archived attempt, or a compare pane
  renders, `App` has already loaded `listLedgerBySpeech(sourceId)` into a
  `Set<string>` of kept originals for that source and passes it down.
- `onToggleKeep(phrase)` optimistically flips the local set (100ms
  feedback), then writes: if now kept, `saveLedgerItem({ id: uuid, phrase,
  speech_id: sourceId, source_title, saved_at: Date.now() })`; if now
  removed, `removeLedgerItem` for the matching item (look it up by
  `speech_id` + `phrase` from the loaded per-source list). Persistence is
  best-effort as elsewhere; the UI reflects the toggle immediately.
- Compare renders two panes; each pane's `keptPhrases`/`onToggleKeep` key
  on the SAME source id (both attempts share one source), so keeping a line
  in one pane reflects in the other after the set updates.

### 4.3 Ledger screen (`src/components/Ledger.tsx`, view `ledger`)

- Reached via `#/ledger` from the top nav. Heading names the screen; a
  short positive line states what it holds.
- Loads the first page via `listLedger` (cap 30) and renders items grouped
  by source. Because the compound index clusters by `speech_id`, items
  arrive contiguous per source; render a `<section>` per source with an
  `<h2>` of `source_title`, and the kept lines under it (each with its
  saved date and a quiet remove control). A load-more control fetches the
  next page via `nextCursor`; when a group spans a page boundary, continue
  it under the same heading (compare the last rendered `speech_id` to the
  first of the next page and merge). State the load-more behaviour plainly;
  do not silently cap.
- Remove: a per-row control calls `removeLedgerItem(id)` and drops the row
  optimistically. Removing the last item in a group removes its heading.
- Empty state (no ledger items at all): a designed, positive message that
  tells the user what the screen is for and the exact first step (open any
  alignment and keep a line). It is not a blank region.
- Loading state: skeleton rows that hold layout while the first page reads.
- Fully usable at 390px, no horizontal scroll, ~44px targets on rows,
  remove, and load-more.

### 4.4 Paste-your-own (`src/components/PasteScreen.tsx`, view `paste`) and source resolution

**Paste entry screen:**
- Reached via `#/paste` from a clear entry on the library screen.
- ONE labelled `<textarea>` with a real example placeholder (show, don't
  tell) and ONE primary action ("Find the moves" or similar, swept). Back
  is secondary.
- On submit, `validatePaste(text)`. On `too-long` or `too-short`, show a
  designed error in product voice with what to do next (trim to the cap, or
  add a few more sentences). Do not truncate silently.
- On valid input: build the source with `extractDeck` and `deriveTitle`,
  store it via `saveUserText({ id: "paste:" + crypto.randomUUID(), title,
  text, sentences, hints, created_at: Date.now() })`, then navigate to the
  read screen `#/speech/<encoded paste id>`. A brief working state covers
  the store + navigate step.

**Source resolution (extend `App.tsx`):**
- Introduce a resolved-source concept so the read/reconstruct/study/archive
  path works for both curated and user sources without branching the loop.
  A curated source resolves synchronously from `getSpeech(id)`; a
  `paste:`-prefixed id resolves asynchronously from `getUserText(id)` into
  a state field, with a loading state while it loads and the existing
  not-found path only after the DB lookup fails.
- The resolved source exposes the shape the loop already uses: `title`,
  `sentences`, `hint_deck` (a curated speech's `hint_deck`, or a user
  text's `hints`), and an `originalLabel` (the curated `author`, or a fixed
  positive label such as "Your text" for a user source). `align(spoken,
  source.sentences)` and the archive (`speech_id = source.id`) are
  otherwise identical.
- The read screen for a user source shows its moves (the derived hints) and
  full text (the pasted text, rendered as text nodes) and offers the warm-up
  as the primary action and the archive entry, exactly like a curated
  speech. Scheduling a cold attempt is NOT required for user sources; the
  EPIC 3 schedule panel keys on source id and MAY be reused as-is if it
  needs no user-source special casing, but it must not gate or complicate
  the warm-up loop. If reusing it adds branching, omit it for user sources.
- Attempts and kept lines from a user source tag to `source.id`
  (`paste:<uuid>`) and `source.title`, so the archive and the ledger group
  them under the pasted text's title with no special cases.

### 4.5 Settings and export (`src/components/Settings.tsx`, view `settings`)

- Reached via `#/settings` from the top nav.
- A short heading and the plain privacy statement that nothing here leaves
  the device (positive voice, no em-dash).
- Two primary export actions: "Download JSON" and "Download Markdown".
  Each reads all data via `readAllForExport()`, builds the file with the
  `src/lib/export.ts` builder (supplying `Date.now()` as `exported_at`),
  and triggers the download. Give the button a pressed/working state so the
  press is acknowledged within 100ms.
- If there is nothing to export (no attempts and no ledger), the controls
  say so positively and point at recording a first reconstruction, rather
  than downloading an empty file.
- Fully usable at 390px.

### 4.6 SEED_DEMO / demo path (preserve prior behaviour)

The demo path (`SEED_DEMO` or `?demo=1`) still lands directly on the
featured speech's populated sample alignment surface within a minute, no
input, no walk. The ledger, paste, and export features do not change the
demo entry. Do not seed a fake ledger, a fake pasted source, or fake
attempts for the demo. The sample surface may show the keep control (it is
harmless and reversible), but the demo must not require it.

---

## 5. Ordered task list (each with acceptance criteria)

**T1 — Data model and migration (`types.ts`, `db.ts`).**
Add `LedgerItem` and `UserText` to `src/types.ts`. Bump `DB_VERSION` to 3.
Create the `ledger` store (with the `by_speech_saved` compound index) and
the `user_texts` store in `onupgradeneeded`, leaving `attempts` and
`schedules` untouched. Add `saveLedgerItem`, `removeLedgerItem`,
`listLedgerBySpeech`, `listLedger` (paginated cursor), `countLedger`,
`saveUserText`, `getUserText`, and `readAllForExport` (audio stripped).
*Done when:* unit tests (with `fake-indexeddb`) prove: a v2 database opens
at v3 with existing `attempts`/`schedules` rows intact and the two new
stores present; ledger items round-trip; `listLedgerBySpeech` returns only
one source's items; `listLedger` returns a capped page clustered by source
and pages through with the cursor; `removeLedgerItem` deletes by id;
`countLedger` matches; a large ledger for OTHER sources does not appear in
or enlarge one source's `listLedgerBySpeech` (index isolation);
`saveUserText`/`getUserText` round-trip by id; `readAllForExport` returns
attempts with no `audio_blob`.

**T2 — Deterministic hint extraction (`src/lib/hints.ts`).**
Add `validatePaste`, `extractDeck`, `deriveTitle`, and the size constants.
*Done when:* unit tests prove `validatePaste` rejects over-`PASTE_MAX_CHARS`
and under-`PASTE_MIN_CHARS` input and accepts a normal paste; `extractDeck`
returns `sentences` and `hints` of equal length with one cue per sentence,
each cue one line and derived only from that sentence (no external text, no
model), and reuses `segmentSentences`; `deriveTitle` is deterministic and
falls back to the positive default on empty input; the derived cue is
demonstrably not a paraphrase (it is a prefix/leading-clause of its
sentence).

**T3 — Export builders (`src/lib/export.ts`).**
Add `buildExportJson`, `buildExportMarkdown`, and the download helper.
*Done when:* unit tests prove `buildExportJson` emits valid JSON containing
attempts (text fields and alignment, NO audio), ledger items, and user
texts, with deterministic ordering and a passed-in `exported_at`;
`buildExportMarkdown` emits a document with the ledger grouped by source and
attempts grouped by source with aligned pairs; both builders' static
headings/labels are copy-swept (no em-dash, no banned vocabulary, no
"unlock").

**T4 — Save-to-ledger on the alignment surface (`AlignmentSurface.tsx`, `App.tsx`).**
Add the optional `keptPhrases`/`onToggleKeep` props and the keep toggle on
original-bearing pairs; wire `App` to load per-source kept phrases and to
save/remove on toggle across the study view, opened archived attempts, and
compare panes.
*Done when:* a component test shows the keep toggle renders only on pairs
with an original, reflects kept state via `aria-pressed`, and calls
`onToggleKeep` with the exact original line; a test asserts the surface
still shows no `%`, no pass/fail, no per-word error class with keep enabled;
an integration/E2E path keeps a line from a study surface and it persists.

**T5 — Ledger screen and navigation (`Ledger.tsx`, `nav.ts`, top nav).**
Add the `ledger` view and `#/ledger` route (update `nav.ts`/`nav.test.ts`).
`Ledger` renders the grouped, paginated list, the remove control, the
designed positive empty state, and the loading skeleton. Add the top nav
links.
*Done when:* a component test renders groups headed by source with kept
lines and dates, removes a row, and shows the positive empty state when
there are no items; `parseHash`/`buildHash` unit tests cover `#/ledger`; an
E2E test keeps a line, opens the ledger, and sees it grouped under its
source.

**T6 — Paste-your-own and source resolution (`PasteScreen.tsx`, `App.tsx`, `Library.tsx`, `nav.ts`).**
Add the `paste` view and `#/paste` route and a library entry point. The
paste screen validates, extracts the deck, stores the `UserText`, and
navigates into the read screen. `App` resolves curated and `paste:` sources
uniformly so the read → warm-up → align → study → archive loop runs on
pasted text with the `originalLabel` set to the user's own text.
*Done when:* a component test shows an over-cap paste is rejected with a
designed error and a valid paste stores a source and navigates; a test
confirms pasted markup renders as literal text (no HTML injection);
`parseHash`/`buildHash` cover `#/paste` and a `paste:<uuid>` speech id; an
E2E test pastes text, extracts the moves, does a warm-up, and reaches the
alignment surface labelled with the user's own text, with the attempt saved
to that source's archive.

**T7 — Settings and export screen (`Settings.tsx`, `nav.ts`, top nav).**
Add the `settings` view and `#/settings` route and the nav link. The screen
carries the privacy statement and the two export actions, with the
nothing-to-export state.
*Done when:* a component test triggers each export action and asserts a
download of the right filename and content type is offered from an
in-memory blob (no network); `parseHash`/`buildHash` cover `#/settings`; an
E2E test clicks an export action and asserts the download fires locally.

**T8 — Designed states, mobile pass, README, copy sweep, existing tests.**
All new surfaces usable at 390px with no horizontal scroll and ~44px
targets; ledger/paste/settings designed states positive and in voice;
README updated for the ledger, paste, and export with accurate commands;
mechanical copy sweep over every added/changed user-visible string
(including the export files' static labels); existing unit/component/E2E
suites pass (update any touched by the new nav or the surface prop change).
*Done when:* an E2E test at 390px asserts no horizontal scroll on the
ledger, paste, and settings screens and on the alignment surface with the
keep control; the sweep finds no em-dashes/en-dashes, no banned vocabulary,
no "unlock", and no negative empty-state phrasing in product-voice strings
(verbatim speech text and the user's own paste stay exempt); `npm test` and
`./scripts/e2e.sh` both pass.

---

## 6. Test plan (each acceptance criterion → automated proof)

`fake-indexeddb` is already a dev dependency (from EPIC 3). Reuse it for the
new DB unit tests. It is dev-only; it adds no runtime origin or bundle
weight.

**Unit (Vitest):**
- DB ledger (→ T1, AC1, AC2): items round-trip; `listLedgerBySpeech`
  isolates one source; `listLedger` is capped, clustered by source, and
  cursor-paged; `removeLedgerItem` deletes; index isolation proves a large
  ledger for other sources does not slow or leak into one source's read.
- DB user texts + export (→ T1, T3, AC3, AC4): `saveUserText`/`getUserText`
  round-trip; `readAllForExport` strips audio; a v2→v3 open keeps existing
  attempts/schedules.
- Hints (→ T2, AC3): `validatePaste` bounds; `extractDeck` one cue per
  sentence, equal-length arrays, cue derived only from its sentence, no
  model call; `deriveTitle` deterministic with a positive fallback.
- Export builders (→ T3, AC4): `buildExportJson` valid JSON, no audio,
  deterministic order; `buildExportMarkdown` grouped structure; static
  labels copy-swept.
- Nav (→ T5, T6, T7): `parseHash`/`buildHash` cover `#/ledger`, `#/paste`,
  `#/settings`, and a `paste:<uuid>` speech id, and still round-trip the
  existing routes.

**Component (Vitest + Testing Library, jsdom):**
- AlignmentSurface keep (→ T4, AC1): toggle renders only on original-bearing
  pairs, reflects `aria-pressed`, calls `onToggleKeep` with the original;
  differentiator guard (no `%`, no pass/fail, no per-word error class)
  holds with keep enabled.
- Ledger (→ T5, AC2): groups headed by source with dated rows; remove drops
  a row; the positive empty state renders when there are no items; no
  negative empty-state phrasing.
- PasteScreen (→ T6, AC3): over-cap and under-min rejected with designed
  errors; a valid paste stores a source and navigates; pasted markup renders
  as literal text.
- Settings (→ T7, AC4): each export action triggers a local download of the
  right filename/type; the nothing-to-export state renders when empty.

**E2E (Playwright), transcription stubbed via `__E2E_TRANSCRIPT__`:**
- Ledger (→ AC1, AC2): from a study surface, keep a line; open `#/ledger`;
  see it grouped under its source with its date; remove it and see the
  group empty. Assert no `%` or pass/fail on the surface with keep present.
- Paste (→ AC3): open paste from the library, paste a short passage, extract
  the moves, do a warm-up, and reach the alignment surface labelled with the
  user's own text; confirm the attempt appears in that source's archive.
  Confirm an over-cap paste shows the designed error.
- Export (→ AC4): from settings, click each export and assert a download
  fires with the right filename and `text/`... or `application/json` type,
  from a local `blob:`/object URL (not a network request).
- Mobile (→ QUALITY BAR §2): at 390px, no horizontal scroll on the ledger,
  paste, and settings screens and on the alignment surface with the keep
  control.
- No-upload / headers (carried): same-origin GETs only,
  `crossOriginIsolated === true`, headers intact; the export downloads are
  local blobs, not network requests.
- SEED_DEMO / demo (→ §4.6, carried): the demo still lands on the featured
  populated sample surface within a minute, with no ledger, paste, or export
  requirement.

**Existing tests to update (part of T8):** any spec or component test
touched by the new masthead nav or by the `AlignmentSurface` prop addition.
Preserve what each originally proved.

**Copy sweep (mechanical, part of T8 DONE):** grep every added/changed
user-visible string (keep control labels and accessible names, ledger
heading/intro/empty/rows/remove, paste heading/placeholder/action/errors,
settings heading/privacy/export labels, the export files' static
headings/labels, new nav links) for `—`, `–`, the banned vocabulary, the
word "unlock", and negative empty-state phrasing; fix every hit. Verbatim
speech text, author names, and the user's own pasted text stay exempt.

---

## 7. Notes, decisions, and exemptions

- **The keep control must stay additive and neutral.** It touches the
  differentiator surface, so it is held to it: keep marks a line worth
  taking, never a line marked wrong. No count of missed lines, no score, no
  red ink. This is the single most important constraint in the EPIC.
- **Hints for pasted text are cues, not paraphrases.** The non-goal is
  explicit: no LLM-generated hints. A deterministic leading-clause cue is
  the honest equivalent of the curated deck's one-line-per-sentence hint.
  Do not reach for a model, and do not present the cue as an authored
  paraphrase.
- **Pasted text is untrusted local input.** Size-cap it and treat it as a
  plain string. Never render it as HTML and never log it.
- **Uniform source id.** Curated sources keep their existing ids; user
  sources use `paste:<uuid>`. The archive, schedule store, and ledger all
  key on this id with no special cases, which is why the loop reuses cleanly.
- **Export excludes audio by design.** Audio blobs stay on the device.
  The export is the text record. Re-import/restore is out of scope; raise
  it via `requested_tasks` if it is wanted next.
- **Migration is forward-only.** Bumping to v3 adds two empty stores and
  touches nothing existing. Do not transform or delete any row.
- **The ledger is a list, not a dashboard.** No analytics, no counts of
  performance, no ranking of sources. Grouping by source and a saved date
  is the whole model.

## 8. Assumptions (flagged; none block the build)

- The planner's scope block for this EPIC was present and authoritative;
  this spec expands it directly. No blocking questions.
- `PASTE_MAX_CHARS = 10000`, `PASTE_MIN_CHARS = 40`, `HINT_WORDS = 8`, and a
  ledger page cap of 30 are chosen as sane defaults; the implementer may
  adjust within reason as long as the input stays genuinely size-capped,
  the hint stays a one-line deterministic cue, and the ledger stays
  paginated and index-backed.
- The export is delivered as two files (one JSON, one Markdown), each
  covering both the archive and the ledger. If the implementer finds a
  clearer split (for example four files), that is acceptable provided every
  §6 export criterion is proven and audio is never included.
- Scheduling a cold attempt for a pasted source is neither required nor
  forbidden; reuse the EPIC 3 panel only if it needs no user-source special
  casing.
