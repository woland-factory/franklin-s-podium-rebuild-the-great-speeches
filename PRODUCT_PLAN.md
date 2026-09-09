# PRODUCT PLAN — Franklin's Podium

Rebuild the great speeches out loud. A private practice room for
composing speech under pressure, running entirely on the user's device.

## Core value (one sentence)

Speak a great oration from memory after a deliberate delay, then study
your own sentences laid beside the master's, with nothing ever leaving
your device.

## North star

The excellent version of this product is what a practice room is to a
musician: a place a self-directed person returns to alone, most days, to
run one quiet ten-minute rep on a skill that scares them. Over months the
archive shows their cold reconstructions landing closer to the originals
in their own words, and they carry a growing ledger of rhetorical moves,
lifted from two millennia of the best speeches ever given, into real
meetings. The feeling is private, unjudged, and compounding: the tool
never grades the sound of your voice, it shows you a specific, concrete
gap between what you meant and what a master said, and every session
makes the next one sharper. Success is a person who used to freeze when
asked to explain something out loud and now has a rep, a record, and a
vocabulary they built themselves.

## Quality differentiator

**The alignment surface.** The one dimension this app must clearly beat
everyone on is turning the gap between your words and a master's into a
neutral study object you examine, never a score you fail. Delivery
coaches grade how you sound; recitation checkers punish any deviation
from the text. Franklin's Podium does the opposite: it aligns your spoken
reconstruction to the original sentence by sentence, tolerant of
paraphrase, and simply shows you the two side by side so you can see the
move you missed. No percentage, no pass or fail, no red ink on a
rephrasing. That surface is the product, and it must feel like insight,
not judgment.

## Signature moment

You speak from memory into your laptop, nothing leaves the machine, and
seconds later your own sentences sit aligned beside Lincoln's with the
gaps visible. The first time your vague sense of "I speak worse than I
think" becomes a specific list of moves the master made and you didn't.

---

## Binding design constraints (from VALIDATION.md)

These are spec, not advice. Every EPIC inherits them.

1. **The feedback surface rewards paraphrase.** Align by meaning
   (position + lexical overlap, optionally sharpened by on-device
   embeddings). Present pairs neutrally. Never render a percentage,
   pass/fail state, or word-level red ink that punishes rephrasing. A
   verbatim-recall diff is a product failure even if every test passes.
2. **Transcription fidelity is probed in EPIC 1.** Browser-sized Whisper
   mis-hears hesitant, quiet, accented free speech, and each error reads
   as a gap blamed on the speaker. Mitigations are required, not
   optional: show the transcript for one-tap correction before aligning,
   strip filler words and restarts as noise, keep the audio locally
   replayable to spot-check any flagged line, prefer the small model on
   WebGPU. If a large share of flagged gaps trace to the transcriber, the
   honest fallback is a typed-reconstruction mode with speaking as one
   input option, and that finding must be reported.
3. **The return loop is designed, not assumed.** Day one delivers value
   on its own (the act of condensing, plus a same-day warm-up round that
   shows the alignment surface immediately). The enforced multi-day gap
   applies only to the real cold attempt. Offer a calendar-file reminder.
   Make the model download a background task with honest progress.

---

## Runtime LLM: none

The practice loop needs no runtime LLM. Hint decks for the curated
library are authored and generated at build time by the build agents and
shipped as static data. Transcription is on-device Whisper via
transformers.js (WebGPU, WASM fallback). Alignment is deterministic code,
optionally sharpened by on-device embeddings that download the same way
the transcription model does. Paste-your-own-text mode uses deterministic
hint extraction. There is no BYOK surface, no account, and no gateway
request: the first moment of value needs no key and no upload.

---

## Users and MVP user stories

The user is someone whose thinking outruns their mouth: an engineer,
student, new manager, non-native speaker, or debate/Toastmasters member
who freezes or rambles when asked to explain something aloud.

- As a first-time visitor, I land on the app and understand within
  seconds that it is a private tool for practicing speaking, and I can
  start with one tap.
- As a beginner, a short guided path walks me through my first
  reconstruction once, then never shows again.
- As a practicer, I pick a speech, read it, and condense it into
  one-line hints, then do a same-day warm-up reconstruction aloud and see
  my sentences aligned beside the original.
- As a practicer, I schedule the real cold attempt for a few days out,
  add it to my calendar, and the app holds me to the gap.
- As a returning user, I redo a speech and see my earlier attempt beside
  the new one, so I can see the distance I closed.
- As a collector, when the alignment shows a construction the master used
  and I didn't, I tap once to save it to my ledger, tagged by source.
- As someone with my own material, I paste a design doc or talk notes and
  run the same loop with auto-extracted hints.
- As the owner of my data, I export my archive and ledger to a file I
  keep, because nothing lives on a server.

## Data model sketch (all client-side, IndexedDB)

- **Speech** (static, bundled): `id`, `title`, `author`, `year`,
  `source_url`, `public_domain_basis`, `full_text`, `sentences[]`,
  `hint_deck[]` (ordered one-line hints), `notes`.
- **Attempt** (local): `id`, `speech_id`, `created_at`,
  `mode` (`warmup` | `cold`), `transcript`, `corrected_transcript`,
  `audio_blob?`, `alignment` (ordered pairs of {your_sentence,
  original_sentence, relation}).
- **ScheduleEntry** (local): `speech_id`, `condensed_at`, `reveal_at`,
  `status` (`waiting` | `ready` | `done`).
- **LedgerItem** (local): `id`, `phrase`, `speech_id`, `note?`,
  `saved_at`.
- **UserText** (local, paste-your-own): `id`, `title`, `text`,
  `sentences[]`, `hints[]`.

## Screen inventory (static SPA, no backend routes)

- `/` — Home / library: browse curated speeches; entry point to
  paste-your-own; first-run guided path starts here.
- `/speech/:id` — Read and condense: full text, hint deck, start warm-up,
  schedule cold attempt, countdown when waiting.
- `/speech/:id/reconstruct` — Record → transcribe → correct transcript →
  alignment study surface.
- `/speech/:id/archive` — Attempts over time; compare two side by side.
- `/ledger` — The stolen-phrases ledger, grouped by source speech.
- `/paste` — Paste-your-own-text loop.
- `/settings` — Model/download status, export archive and ledger, plain
  statement that nothing leaves the device.

## Security and hosting posture (honest mapping to the QUALITY BAR)

There is no application server and no user data leaves the browser, so
the security bar is met structurally: nothing to authorize server-side,
nothing uploaded, no PII to log, no mutation endpoints to rate-limit. The
concrete work is on the static host: set a strict CSP, set COOP and COEP
headers so cross-origin isolation lets the WASM backend use threads and
WebGPU works, pin the model asset source, and keep the container free of
secrets. Input validation applies at the boundary between the app and
untrusted local input (pasted text is size-capped and treated as text,
never HTML).

---

## EPIC list (build order)

Each EPIC is small and independently reviewable. The final EPIC is a
polish pass with no new features.

### EPIC 1 — Spoken alignment probe and staging scaffold

**Scope.** The walking skeleton and the riskiest-premise probe in one
unit: a single-page app with one speech (the Gettysburg Address) and a
pre-baked ten-hint deck. Record aloud, transcribe on-device, correct the
transcript, align, study. Plus the staging deploy scaffold.

**Acceptance criteria.**
- The app is a static SPA; first meaningful render shows real content
  (the speech screen), not a blank page, within about 1 second.
- A record control captures microphone audio in-browser. On-device
  Whisper (transformers.js) transcribes it, using WebGPU when available
  and a WASM fallback otherwise.
- The model download runs in the background with honest progress and is
  cached after the first visit; the UI stays usable and the layout holds
  steady while it loads.
- The raw transcript is shown for one-tap correction before alignment;
  filler words and restarts are stripped as noise.
- Sentence alignment is meaning-tolerant (position plus lexical overlap,
  optional on-device embeddings) and presents pairs neutrally side by
  side. It never shows a percentage, a pass/fail state, or word-level red
  ink that penalizes paraphrase.
- The recorded audio is retained locally and replayable so the user can
  spot-check any flagged line against what they actually said.
- No data is uploaded. The only network fetches are static assets and the
  model from a pinned source.
- A `Dockerfile` and `docker-compose.staging.yml` build and serve the
  SPA. The server sets COOP, COEP, and a strict CSP so WASM and WebGPU
  work. The `SEED_DEMO` path shows the differentiator within a minute
  with no hand-crafted input.

**Non-goals for this EPIC.** No library beyond one speech, no schedule,
no archive, no ledger, no paste mode.

### EPIC 2 — Speech library, reading, warm-up, and first run

**Scope.** Day-one value before any wait. A curated public-domain speech
library, the read-and-condense screen, the same-day warm-up
reconstruction, and the guided first run.

**Acceptance criteria.**
- The library screen lists curated speeches, each showing title, author,
  and year. Every bundled speech is pre-1929 or a US-government work, and
  its public-domain basis is recorded in the static data.
- The read/condense screen shows the full text and its one-line hint
  deck.
- After reading, the user can immediately do a same-day warm-up
  reconstruction and reach the alignment surface, so value exists before
  the multi-day wait.
- A guided first run of 2 to 4 steps, anchored to the real controls, one
  short imperative sentence each, walks a new user through completing one
  reconstruction. It is skippable at any step, appears only until the
  first success, and never again for a returning user.
- Empty, loading, and error states are designed on every screen. Empty
  states say what the screen is for and what to do first, in positive
  phrasing.
- Every screen is fully usable at a 390px viewport with no horizontal
  scroll and touch targets of about 44px.

**Non-goals for this EPIC.** No schedule enforcement, no archive
comparison, no ledger, no paste mode, no scores.

### EPIC 3 — The spaced loop and the attempt archive

**Scope.** The mechanism that makes it deliberate practice: the enforced
forgetting gap, a calendar reminder, and the accumulating archive.

**Acceptance criteria.**
- After condensing, the user schedules a cold attempt. The multi-day gap
  is stored locally and the cold attempt is gated until the reveal time,
  with a clear countdown. The warm-up stays available while waiting.
- The user can download an `.ics` calendar file for the reveal date.
- Each reconstruction is saved to a per-speech archive with its
  timestamp, transcript, alignment, and optional audio.
- Redoing a speech shows a previous attempt beside the new one.
- The archive stays fast as it grows: lists are paginated or capped and
  IndexedDB queries use indexes. No view gets slower with every attempt
  saved.

**Non-goals for this EPIC.** No trendline charts or analytics, no ledger,
no paste mode, no reminder emails or push (calendar file only).

### EPIC 4 — Stolen-phrases ledger, paste-your-own, and export

**Scope.** The second durable artifact and the modern-material path.

**Acceptance criteria.**
- From any alignment pair, one tap saves a phrase to the ledger, tagged
  with its source speech.
- The ledger screen lists saved moves grouped by source speech, with a
  positive empty state that tells the user how to add the first one.
- Paste-your-own-text mode accepts pasted text (size-capped, treated as
  text), extracts a hint deck deterministically with no LLM, and runs the
  same reconstruct-and-align loop.
- Export writes the archive and ledger to JSON and to Markdown as local
  downloads.

**Non-goals for this EPIC.** No cloud sync, no sharing or import from
other users, no LLM-generated hints for pasted text.

### EPIC 5 — Polish pass (no new features)

**Scope.** A UX, performance, and accessibility pass over the whole
delivered product against the QUALITY BAR and the quality differentiator.
Tighten what exists; add nothing.

**Acceptance criteria.**
- Perceived speed: first meaningful render within about 1 second,
  interaction feedback within 100ms, model download non-blocking with
  visible progress.
- The alignment surface reads unmistakably as a neutral study object:
  verified across real hesitant speech that flagged gaps are examinable,
  never scored.
- Copy sweep passes across every user-visible string: no em-dashes, no
  banned LLM vocabulary, no negative empty-state phrasing.
- Accessibility basics: sufficient contrast, visible focus states, every
  input labeled, semantic headings and landmarks, keyboard reaches
  everything, alt text on meaningful images.
- Mobile-first verified at 390px on every screen.
- `README.md` lets a stranger understand, run (commands verified against
  the actual compose files), and contribute, with no pipeline internals.

---

## Non-goals / Out of scope (product-wide fence)

- **No delivery metrics.** No pace, filler-word counts, eye contact,
  volume, or any coaching of how you sound. That is Yoodli's territory
  and abandons the one gap this app fills.
- **No scores or grades.** No percentage, pass/fail, or word-level red
  ink that punishes paraphrase, anywhere, ever.
- **No accounts, no server storage, no cloud transcription.** Nothing is
  uploaded. All models run on-device.
- **No "Podium Shadow" sibling.** No pitch, pause, or pace contour, no
  playing the original recording to imitate delivery.
- **No social features.** No sharing, leaderboards, or public profiles.
- **No copyrighted speeches.** The library is pre-1929 and US-government
  works only, checked speech by speech at build time.
- **No native mobile apps.** Web only, mobile-first.
- **No email or push reminders.** The return nudge is a calendar file.
