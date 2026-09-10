# EPIC SPEC — Spoken alignment probe and staging scaffold

## Quality differentiator (read this first)

**The alignment surface.** This product wins by turning the gap between
your spoken words and a master's into a neutral study object you examine,
never a score you fail. Delivery coaches grade how you sound; recitation
checkers punish any deviation. Franklin's Podium aligns your spoken
reconstruction to the original sentence by sentence, tolerant of
paraphrase, and shows the two side by side so you see the move you missed.

**What this demands of THIS EPIC:** the alignment surface IS the thing
this EPIC ships, and it is where the app must feel like insight, not
judgment. Concretely: the match must survive paraphrase and reordering
(align by meaning, not by string equality), and the surface must never
render a percentage, a pass/fail state, or word-level red ink on a
rephrasing. A verbatim-recall diff is a product failure even if every
test passes. Build the alignment view first-class; treat everything else
(recording, transcription, the shell) as plumbing that delivers a user's
sentences to it.

---

## 1. Scope

### In scope
A single-page, fully client-side app with exactly one speech (the
Gettysburg Address) and its pre-baked ten-hint deck. One end-to-end loop:

1. Read the speech and its hint deck (first screen, renders instantly).
2. Record a spoken reconstruction in-browser.
3. Transcribe it on-device with Whisper via transformers.js (WebGPU when
   available, WASM fallback).
4. Show the raw transcript for one-tap correction; strip filler and
   restarts as noise.
5. Align the corrected transcript to the original sentence by sentence,
   meaning-tolerant, and present the pairs neutrally side by side.
6. Keep the recorded audio locally and replayable to spot-check any line.

Plus the staging deploy scaffold: a `Dockerfile` and
`docker-compose.staging.yml` that build and serve the SPA with COOP, COEP,
and a strict CSP so WASM threads and WebGPU work, and a `SEED_DEMO` path
that shows the alignment surface within a minute with no hand-crafted
input.

### Out of scope (binding non-goals — do not build)
- No second speech and no library/browse UI. One speech only.
- No schedule, enforced multi-day gap, countdown, or `.ics` reminder.
- No archive, no attempt history list, no compare-two-attempts view.
- No ledger / stolen-phrases saving.
- No paste-your-own-text mode and no hint extraction.
- No scores, grades, percentages, pass/fail, or word-level red ink,
  anywhere, ever.
- No accounts, no server storage, no network upload of any kind, no cloud
  transcription, no runtime LLM, no BYOK surface, no gateway calls.
- No delivery metrics (pace, filler counts as a *score*, volume, pitch).
  Filler stripping here is transcript cleanup, never a coaching metric.
- No export.

The single latest attempt may be persisted locally (see §4.4) only so the
audio stays replayable across a reload. That persistence must NOT grow
into an archive UI; storing one overwritable record is the ceiling for
this EPIC.

---

## 2. Quality-bar obligations that land in THIS EPIC

The quality bar is spec. The clauses that bite here, made concrete:

- **Perceived speed (§1).** First meaningful render shows the speech
  screen (title, full text, hint deck) within about 1 second, painted
  from bundled static data with no dependency on the model download. The
  ASR/model code path is dynamically imported so it stays out of the
  initial bundle. Every control gives feedback within 100ms (pressed
  states, a live recording indicator, determinate download progress).
- **Mobile-first (§2).** Fully usable at 390px: no horizontal scroll,
  ~44px touch targets, readable without zoom. The side-by-side alignment
  must degrade gracefully to a stacked/paired layout on narrow screens
  without becoming a score sheet.
- **Designed states (§3).** The model-loading area holds layout steady
  with a skeleton and determinate progress (never a white screen or a
  dead spinner). Microphone-denied, transcription-failed, and
  no-speech-detected states each say, in the product's voice, what
  happened and what to do next. No raw errors.
- **First-run walk (§4).** A brand-new user is led through the core action
  once: a short guided path (2–4 steps) anchored to the real controls on
  this screen ("Read the hints", "Record your version", "Fix any misheard
  words", "Study the pairs"). Each step is one short imperative sentence.
  It is skippable at any step, appears only until the first completed
  alignment, and never again for a returning user (persist a
  `first_run_done` flag in `localStorage`). This is the minimal walk for
  the single probe screen; EPIC 2 extends it across the library. Do not
  build EPIC 2's version here.
- **Radically simple interface (§7).** One obvious primary action per
  state (Record → Study → Replay). Secondary actions visibly subordinate.
- **Copy sounds human (§8).** Sweep every user-visible string you add for
  em-dashes/en-dashes, the banned LLM vocabulary, and negative empty-state
  phrasing before finishing. See §7 for the exemption covering Lincoln's
  verbatim text.
- **Accessibility (§6).** Every control labeled, visible focus states,
  keyboard reaches Record/Study/Replay/Edit, semantic headings, sufficient
  contrast. The recording state must be conveyed non-visually too (aria-live).
- **Security hygiene (§5).** There is no app server and nothing is
  uploaded, so the bar is met structurally EXCEPT the static-host work:
  strict CSP, COOP/COEP, pinned same-origin model source, no secrets in
  the image. Pasted/untrusted input is not in scope this EPIC.
- **README (§9).** A stranger can understand the app, run it (exact,
  verified `docker compose -f docker-compose.staging.yml up` commands and
  the local dev commands), and find where code and tests live. No factory
  internals.

---

## 3. Technical design — stack and hosting

### 3.1 Stack (smallest thing that works)
- **Build:** Vite + React + TypeScript, output a static `dist/`.
- **Router:** minimal. This EPIC is effectively one screen with internal
  steps (read → record → correct → study). A single route is acceptable;
  do not add react-router unless it genuinely simplifies step state.
- **Transcription:** `@huggingface/transformers` (transformers.js v3),
  `pipeline('automatic-speech-recognition', ...)`.
- **Recording:** `navigator.mediaDevices.getUserMedia({ audio: true })` +
  `MediaRecorder`. Decode/resample to 16 kHz mono `Float32Array` via
  `AudioContext.decodeAudioData` before handing audio to the pipeline.
- **Local storage:** IndexedDB for the audio blob + attempt record;
  `localStorage` for the `first_run_done` flag.
- **Tests:** Vitest + @testing-library/react (jsdom) for units/components;
  Playwright for E2E and header/isolation assertions.
- **Static server:** nginx (or Caddy) in the container. nginx is the
  reference choice below because the exact header set matters.

Pin exact versions in `package.json`. No state manager, no CSS framework
required; a small hand-rolled stylesheet or CSS modules is enough for one
screen. Do not add a design system.

### 3.2 On-device model: self-host, pinned, same-origin (critical)
COEP `require-corp` plus a strict `connect-src 'self'` CSP means **every**
runtime fetch must be same-origin. transformers.js by default pulls both
the model weights and the onnxruntime-web WASM binaries from remote CDNs;
under this policy those fetches are blocked. Therefore:

- **Vendor the model at a pinned revision.** Default model:
  `onnx-community/whisper-base.en` (English-only; the one speech is
  English; smaller and more accurate than tiny for this use). Fetch it at
  a pinned commit revision into the served assets under
  `/models/onnx-community/whisper-base.en/`, mirroring the repo's file
  layout (config + tokenizer + `onnx/` weights). Prefer a quantized dtype
  (`q8`, or `fp16` for WebGPU) to keep the download small; record the
  chosen dtype and revision in code and README. This is the "pinned
  source" the acceptance criterion names.
- **Vendor the onnxruntime-web WASM binaries** shipped with the
  `onnxruntime-web` dependency into `/ort/` (same-origin) and set
  `env.backends.onnx.wasm.wasmPaths = '/ort/'`.
- Configure transformers.js for local-only resolution:
  ```
  env.allowRemoteModels = false;
  env.allowLocalModels  = true;
  env.localModelPath    = '/models/';
  env.useBrowserCache   = true;   // Cache API caches after first visit
  ```
- **Model acquisition is a build step, not a git commit.** Add
  `scripts/fetch-model.mjs` (downloads the pinned revision to
  `public/models/...`) and copy the ORT wasm from `node_modules` to
  `public/ort/` (a Vite copy plugin or a script). Git-ignore the vendored
  binaries. The Dockerfile runs the fetch during build so the image serves
  them same-origin. Document the local command in the README.

### 3.3 Backend selection and progress
- Detect WebGPU: attempt `device: 'webgpu'` when `'gpu' in navigator`,
  else fall back to `device: 'wasm'`. Catch WebGPU init failure and fall
  back to WASM at runtime. Surface the active backend honestly in the UI
  (a small, non-alarming line).
- **Honest progress:** pass a `progress_callback` to the pipeline load and
  render a *determinate* bar from the real per-file byte progress
  reported. No fake/indeterminate animation standing in for a real
  download. The rest of the screen (speech text, hints) stays fully usable
  while the model loads; layout does not shift when it finishes.
- WASM threads are available because the page is cross-origin isolated;
  set a sensible `numThreads`. Do not require threads for correctness
  (single-thread must still work).

### 3.4 Headers (nginx) — exact policy
Serve `dist/` with:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`
- `Content-Security-Policy` (strict; single line):
  - `default-src 'self';`
  - `script-src 'self' 'wasm-unsafe-eval';`  (WASM compile needs this)
  - `worker-src 'self' blob:;`  (ORT/transformers workers)
  - `connect-src 'self' blob:;`  (model + ORT are same-origin; blob for audio)
  - `img-src 'self' data:;`
  - `media-src 'self' blob:;`  (audio replay via object URL)
  - `style-src 'self' 'unsafe-inline';`  (drop `'unsafe-inline'` if the
    build emits no inline styles)
  - `font-src 'self';`
  - `object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
- Long-cache immutable hashed assets; do not cache `index.html`.

The page MUST end up with `self.crossOriginIsolated === true`; assert it
in E2E.

### 3.5 SEED_DEMO (deploy-time, static-safe)
The SPA is static, so a deploy-time env var reaches it via a tiny runtime
config file, not a rebuild:
- The container entrypoint writes `/env.js` from the environment before
  nginx starts, e.g. `window.__ENV__ = { SEED_DEMO: "<value>" };`. Served
  same-origin as a normal script (`script-src 'self'` covers it; do not
  inline it into HTML).
- `docker-compose.staging.yml` sets `SEED_DEMO` (default on for staging).
- When `SEED_DEMO` is truthy, the app offers a one-tap **"See an example"**
  affordance (and may auto-run it) that loads a bundled sample spoken
  reconstruction (§4.5) and renders the alignment surface against
  Gettysburg immediately — no microphone, no typing, populated output with
  at least one visible gap. This is the differentiator, reachable within a
  minute of first load. A convenience `?demo=1` query param may also
  trigger it, but env is the contract.
- The sample must produce real, non-empty alignment (matches AND a visible
  missed move); a demo that yields an empty surface does not count.

---

## 4. Technical design — data, cleaning, alignment

### 4.1 Static speech data (bundled)
Ship one JSON/TS module, `src/data/gettysburg.ts`, shaped:
```
{
  id: "gettysburg",
  title: "The Gettysburg Address",
  author: "Abraham Lincoln",
  year: 1863,
  source_url: "<a canonical public-domain source>",
  public_domain_basis: "US government work; delivered 1863, pre-1929 public domain",
  full_text: "<verbatim Bliss-copy text>",
  sentences: [ /* the 10 sentences, verbatim, in order */ ],
  hint_deck: [ /* 10 one-line hints, one per sentence, see below */ ]
}
```
The 10 sentences are the standard Bliss version (sentence 6 and 10 contain
em-dashes in Lincoln's original — preserve them; see §7 exemption).

**Hint deck (author these exact ten, already copy-swept):**
1. Set the clock back 87 years and name the new nation and its founding idea.
2. Now a civil war tests whether such a nation can last.
3. We stand on that battlefield.
4. We came to dedicate ground for those who died here.
5. Doing this is right and proper.
6. In a larger sense we cannot make this ground sacred.
7. The men who fought here already made it sacred, beyond our words.
8. The world will forget our words but not their deeds.
9. The task falls to us, the living, to finish their work.
10. We resolve these dead did not die in vain, and that government by the people endures.

### 4.2 Local persistence (IndexedDB), forward-only
- Database `franklins-podium`, version 1. `onupgradeneeded` creates one
  object store `attempts` (keyPath `id`). Migrations are forward-only:
  bump the version and add stores/indexes in later upgrades; never
  destructively rewrite.
- For this EPIC store at most the single latest attempt:
  `{ id, speech_id, created_at, transcript, corrected_transcript,
  audio_blob, alignment }`. Overwrite on each new reconstruction. No list
  query, no index needed yet.
- `first_run_done` boolean in `localStorage`.

### 4.3 Transcript cleaning (deterministic, pre-alignment)
Pure function `cleanTranscript(raw: string): string`:
- Strip a small, fixed filler set (`um, uh, er, ah, hmm, mm, like` used as
  filler, `you know`, `i mean`, `sort of`, `kind of`) using
  word-boundary, case-insensitive matching. Keep the list short and
  documented; do not over-strip meaningful words.
- Collapse immediate restarts / stutters: adjacent duplicated words or
  short false-start fragments repeated verbatim (e.g. "the the",
  "we we can"). Simple, conservative heuristic only.
- Normalize whitespace. Preserve real content words; this is cleanup, not
  a metric. The cleaned text is what the user sees for correction.
Alignment uses a further normalization (lowercase, strip punctuation,
tokenize) internally; that normalization is not shown to the user.

### 4.4 One-tap correction
Show the cleaned transcript in a labeled, editable textarea. A single
primary button ("Study alignment") accepts the text and runs alignment.
"One-tap" = the user proceeds with one press after optionally editing;
editing must be optional (the cleaned transcript is a usable default).

### 4.5 Alignment — the core contract (meaning-tolerant, neutral)
Pure, deterministic, synchronous module
`src/align/align.ts`, `align(spokenSentences: string[],
originalSentences: string[]): AlignmentPair[]`.

**Algorithm:**
- Segment the corrected transcript into sentences (simple, robust splitter
  on terminal punctuation; do not depend on the model). Segment the
  original from the bundled `sentences[]` (already split).
- Normalize each sentence to a token multiset (lowercase, strip
  punctuation, drop a tiny stopword set optionally).
- Compute a lexical similarity per (spoken, original) pair — token
  overlap, e.g. Jaccard or overlap coefficient. Meaning tolerance comes
  from set overlap, so paraphrase and reordering within a sentence still
  match.
- Produce a **monotonic** alignment that respects order: a sequence
  alignment (Needleman–Wunsch style DP) over the two sentence lists that
  maximizes total similarity while allowing gaps on either side. Position
  is honored because the alignment is order-preserving; overlap decides
  which sentences pair. Ties break by position proximity.
- Output an ordered list of pairs, each:
  `{ spoken: string | null, original: string | null, relation }`
  where `relation ∈ { "aligned", "original-only", "spoken-only" }`.
  - `aligned`: both present, overlap above a low threshold.
  - `original-only`: an original sentence with no spoken counterpart (a
    line the user did not reach). `spoken` is null.
  - `spoken-only`: a spoken sentence with no original counterpart
    (something the user added). `original` is null.

**Hard constraints on the output and its rendering (differentiator):**
- The returned structure MUST NOT contain, and the UI MUST NOT derive or
  display, any overall percentage, score, grade, count-as-score,
  pass/fail badge, or per-word diff highlighting that marks paraphrase as
  wrong. `relation` is a neutral structural label, not a quality rating.
- Optional on-device embeddings to sharpen matching are allowed but NOT
  required for acceptance and are OUT of the default build unless trivial.
  If added, they load via the same self-hosted, pinned, cached mechanism
  as Whisper — never a network embedding API. Do not block this EPIC on
  embeddings.

**Alignment UI (the study surface):**
- Two aligned columns, "You said" and "Lincoln said" (or "The original").
  Each row is one pair, rendered in reading order.
- `original-only` rows show the original text with the "You said" cell
  empty; `spoken-only` rows show the spoken text with the "Lincoln said"
  cell empty. The emptiness itself shows the gap; a small neutral caption
  is allowed ("In the original, not in yours." / "In yours, not the
  original.") but no red ink, no score.
- On 390px, stack each pair (your line above the master's) instead of two
  columns; keep it a study object, never a diff.
- Each pair offers a control to replay the recorded audio (§4.6) so the
  user can spot-check a flagged line against what they actually said.

### 4.6 Audio retention and replay
- Keep the recorded `Blob` for the current attempt in IndexedDB and expose
  replay via an `<audio>` element fed an object URL (`media-src blob:`).
- Replay is available from the alignment surface (a global replay plus,
  ideally, per-line replay of the whole take is acceptable; per-sentence
  audio slicing is NOT required). Revoke object URLs on cleanup.

### 4.7 Network posture (provable)
The only network requests at runtime are same-origin GETs for the static
bundle, `/env.js`, the vendored model files, and the ORT wasm. There are
zero uploads and zero cross-origin data requests. `connect-src 'self'`
enforces it structurally; a test asserts it (§6).

---

## 5. Ordered task list (each with acceptance criteria)

**T1 — Project scaffold + instant speech screen.**
Vite/React/TS app; bundled `gettysburg.ts`; the read screen renders title,
full text, and the ten-hint deck from static data on mount.
*Done when:* first meaningful render shows the speech content with no wait
on any model/network beyond the initial bundle; verified in E2E that the
title and first sentence/hint are visible promptly; ASR code is
dynamically imported and absent from the initial chunk.

**T2 — Recording.**
Mic capture via getUserMedia + MediaRecorder; visible live recording
state (aria-live); stop yields a Blob decoded/resampled to 16 kHz mono.
Microphone-denied is a designed error state with a next step.
*Done when:* a recording can be captured and its audio decoded; denial
shows the designed state, not a raw error.

**T3 — On-device transcription with honest progress + fallback.**
Load the self-hosted pinned Whisper via transformers.js; WebGPU with WASM
fallback; determinate progress bar from `progress_callback`; layout holds
steady with a skeleton; model cached after first load. Active backend
shown honestly. Transcription-failed and no-speech states designed.
*Done when:* recorded audio transcribes on-device; progress is real; a
second visit uses the cache (no re-download); WebGPU-absent path falls
back to WASM; no cross-origin fetches occur.

**T4 — Transcript cleaning + one-tap correction.**
`cleanTranscript` strips the fixed filler set and immediate restarts;
cleaned transcript shown in an editable, labeled field; one primary button
proceeds to alignment.
*Done when:* fillers/restarts are removed from the shown transcript; the
user can edit and proceed with one press; unit tests cover the cleaner.

**T5 — Alignment engine.**
`align()` per §4.5: order-preserving DP over lexical overlap producing
neutral `aligned` / `original-only` / `spoken-only` pairs; no score in the
output shape.
*Done when:* unit tests prove paraphrase and reordering still map to the
correct original; a missing line yields `original-only`; an added line
yields `spoken-only`; the output contains no numeric score/percentage
field.

**T6 — Alignment study surface.**
Two-column neutral side-by-side (stacked on mobile), gaps shown by empty
cells with optional neutral captions, per-attempt audio replay, no
percentage/pass-fail/red-ink anywhere.
*Done when:* the surface renders pairs neutrally; component test asserts
the rendered DOM contains no "%", no pass/fail badge, no word-diff
error styling; replay control present; usable at 390px with no horizontal
scroll.

**T7 — First-run guided walk.**
2–4 step guided path anchored to the real controls, one imperative
sentence each, skippable, shows only until first completed alignment,
never again (localStorage flag).
*Done when:* a fresh profile sees the walk; completing one alignment (or
skipping) dismisses it; a returning profile never sees it; E2E covers
appear-then-never-again.

**T8 — Staging scaffold: Dockerfile + compose + headers + SEED_DEMO.**
Multi-stage Dockerfile builds the SPA and vendors the pinned model + ORT
wasm; nginx serves `dist/` with the exact COOP/COEP/CORP/CSP set;
entrypoint writes `/env.js` from env; `docker-compose.staging.yml` builds,
serves, and sets `SEED_DEMO`; the demo path renders the alignment surface
from the bundled sample within a minute with no input.
*Done when:* `docker compose -f docker-compose.staging.yml up` serves the
app; response headers match §3.4; `crossOriginIsolated` is true;
`SEED_DEMO` on shows the populated alignment surface with a visible gap
and no hand-crafted input; no secrets in the image.

**T9 — README + copy sweep.**
README lets a stranger understand, run (verified commands, including the
local model-fetch step), and contribute (where code and tests live), no
pipeline internals. Mechanical copy sweep over every user-visible string
added.
*Done when:* commands are verified against the actual compose/Dockerfile;
the sweep finds no em-dashes/en-dashes, banned LLM vocabulary, or negative
empty-state phrasing in product-voice strings (Lincoln's text exempt).

---

## 6. Test plan (each acceptance criterion → automated proof)

**Unit (Vitest):**
- `cleanTranscript`: fillers stripped, immediate restarts collapsed,
  meaningful words preserved, whitespace normalized. (→ T4)
- Sentence segmentation: multi-sentence transcript splits correctly,
  including abbreviations/edge cases you choose to handle. (→ T5)
- `align()`:
  - Paraphrase: a reworded sentence maps to its original as `aligned`.
  - Reordering within a sentence still matches (token-set overlap).
  - Missing original → `original-only`; extra spoken → `spoken-only`.
  - Order preserved (monotonic) across a multi-sentence case.
  - **Guard test:** the returned objects expose no percentage/score/
    pass-fail field. (→ T5, differentiator)

**Component (Vitest + Testing Library, jsdom):**
- Speech screen renders title + full text + 10 hints from static data on
  mount with no async model dependency. (→ T1)
- Alignment surface: given a fixed `AlignmentPair[]`, renders two columns
  with correct pairing and empty cells for gaps; DOM contains no "%", no
  pass/fail badge, no per-word error highlight class. (→ T6, differentiator)
- Correction field: cleaned transcript editable; primary button triggers
  alignment. (→ T4)
- Designed states: mic-denied, transcription-failed, no-speech render the
  designed copy, not raw errors. (→ T2, T3)
- First-run walk: renders on a fresh flag, hidden after completion/skip,
  hidden when the flag is set. (→ T7)

**E2E (Playwright):**
- First meaningful render: navigate, assert speech heading + first
  sentence/hint visible promptly; assert initial JS chunk does not include
  the ASR pipeline (code-split). (→ T1, speed)
- Header/isolation: assert COOP/COEP/CORP/CSP response headers match
  §3.4 and `self.crossOriginIsolated === true` in the page. (→ T8)
- No-upload / same-origin only: intercept all requests; assert every
  request is a same-origin GET (static, `/env.js`, `/models/...`,
  `/ort/...`); assert zero cross-origin requests and zero request bodies
  carrying user audio/text. (→ T3, T8, §4.7)
- SEED_DEMO: with the demo env/flag on, assert the alignment surface
  renders populated pairs with at least one visible gap and no manual
  input, quickly after load. (→ T8, first-run/differentiator)
- First-run walk appears then never again across reloads. (→ T7)
- Mobile: at 390px, no horizontal scroll on the read screen and the
  alignment surface. (→ mobile bar)
- **Transcription is stubbed/injected in E2E.** Provide a test seam
  (an injectable transcription provider or a `?e2e`/env-gated fake) that
  returns a fixed transcript so alignment E2E is deterministic and does
  not run Whisper in CI. Keep at least one manual/local check note for the
  real on-device path; do not gate CI on running the real model.

**Copy sweep (mechanical, part of T9 DONE):** grep every user-visible
string added for `—`, `–`, the banned vocabulary, and negative
empty-state phrasing; fix hits. Lincoln's `full_text`/`sentences` are
exempt (see §7).

---

## 7. Notes, decisions, and exemptions

- **Lincoln's text is a verbatim historical quotation.** `full_text` and
  `sentences[]` reproduce the Bliss copy exactly, including the em-dashes
  in sentences 6 and 10. These are source material, not product-voice
  copy, and are EXEMPT from the em-dash/copy sweep. Do not "fix" the
  punctuation of the speech. The hint deck (§4.1) and all UI strings are
  product voice and ARE swept.
- **Model choice is a recommended default, not a hard requirement:**
  `onnx-community/whisper-base.en` at a pinned revision. A different small
  English Whisper is acceptable if it loads local-only via transformers.js
  and meets the size/speed budget; record whatever you pin. "Prefer the
  small model on WebGPU" (VALIDATION constraint) is honored by choosing a
  base/small English model and quantized weights.
- **Embeddings are optional and default-off** for this EPIC (§4.5). Ship
  the lexical-overlap alignment; do not block on embeddings.
- **Audio persistence is deliberately capped** at one overwritable record
  (§4.2) so replay survives a reload without building EPIC 3's archive.
- **Transcription-fidelity finding (VALIDATION constraint 2):** this EPIC
  is the probe. If, in local testing on real hesitant/quiet/accented free
  speech, a large share of flagged gaps trace to transcriber errors rather
  than the speaker, report that in `result.json` `summary` and raise a
  `requested_task` for the typed-reconstruction fallback. Do NOT build the
  typed fallback in this EPIC (out of scope); surface the finding.

## 8. Assumptions (flagged; none block the build)
- The planner's scope block was present and authoritative; this spec
  expands it directly. No blocking questions.
- SEED_DEMO's runtime-env delivery via a generated `/env.js` is a design
  choice to keep the SPA static while honoring a deploy-time env var; no
  STAGING DEPLOY CONTRACT block was present in context to specify a
  different mechanism.
