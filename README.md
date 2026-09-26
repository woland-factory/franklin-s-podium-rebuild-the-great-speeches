# Franklin's Podium

Rebuild the great speeches out loud. Read a famous speech, wait, then speak
your own reconstruction from memory. The app transcribes your voice on your
device and lines your sentences up beside the original so you can see the moves
you missed. Nothing you say ever leaves your machine.

It ships a small curated library of short public-domain speeches and the full
practice loop for each one: pick a speech, read its moves, record, transcribe,
correct, and study. You can schedule a cold attempt a few days out so the words
have time to fade, take a calendar reminder with you, and keep every take in a
per-speech archive to set this month's reconstruction beside last month's.

## Why it exists

Delivery coaches grade how you sound. Recitation tools punish any change of
wording. This one does neither. It aligns your spoken version to the original
sentence by sentence, tolerant of paraphrase, and simply shows the two side by
side. No score, no pass or fail, no red ink. The gap between what you meant and
what a master said becomes something you study, not something you fail.

## How it works

- **On-device transcription.** A small Whisper model runs in your browser
  through [transformers.js](https://github.com/huggingface/transformers.js),
  using WebGPU when available and WebAssembly otherwise. The model downloads
  once with a visible progress bar, then stays cached.
- **Meaning-tolerant alignment.** A deterministic algorithm aligns your
  sentences to the original by lexical overlap while preserving order, so
  reordering and paraphrase still match.
- **A forgetting gap you set.** From a speech's read screen you schedule a cold
  attempt two or more days out. The app holds it closed with a countdown until
  the reveal, while the same-day warm-up stays open. You can download a calendar
  file for the reveal so the reminder lives in your own calendar. No email, no
  push.
- **An archive that compounds.** Every reconstruction, warm-up or cold, is saved
  per speech with its transcript, alignment, and audio. The archive lists them
  newest first, and you can put any two takes side by side on the same neutral
  surface to read the distance between them. No streaks, no scores, no graphs.
- **Private by construction.** There is no server and no account. Audio and
  transcripts stay in your browser (IndexedDB). The only network requests are
  for the app's own static files and the model. The calendar file is built in
  your browser and saved straight to your device.

## Run it

### With Docker (production-style)

The container builds the app, vendors the model and the WebAssembly runtime so
they are served from the same origin, and serves everything through nginx with
the cross-origin isolation headers WebGPU and threaded WASM need.

```bash
git clone <this-repo-url>
cd franklin-s-podium-rebuild-the-great-speeches
docker compose -f docker-compose.staging.yml up --build
```

The build downloads the pinned Whisper model, so the first build needs network
access and takes a few minutes. Once it is up, the app is served on container
port 80. `SEED_DEMO=1` (set in the staging compose) makes the app show a sample
reconstruction aligned against Gettysburg the moment it loads, so you can see
the study surface without recording anything.

### Locally with Node

```bash
npm install
npm run fetch-model   # downloads the pinned Whisper model into public/models
npm run copy-ort      # copies the WASM runtime into public/ort
npm run dev
```

Open the printed URL. The model steps are only needed for real transcription;
the reading screen and the sample alignment work without them.

The pinned model is `onnx-community/whisper-base.en` (English only), dtype `q8`,
at revision `51eefc0af78b103839eda9e7e4f4186acc6517fe`.

## Develop and test

- **Source** lives in `src/`:
  - `src/align/` holds the pure logic: `align.ts` (the alignment engine),
    `clean.ts` (transcript cleanup), `segment.ts` (sentence splitting).
  - `src/lib/` holds the runtime plumbing: recording, transcription, and
    IndexedDB persistence (`db.ts`, including the per-speech attempt archive and
    schedules), the spaced-loop gating (`schedule.ts`), and the calendar file
    builder (`ics.ts`).
  - `src/components/` and `src/App.tsx` hold the UI.
  - `src/data/` holds the speech library: one module per speech (its verbatim
    public-domain text, hint deck, and provenance) and `speeches.ts`, the
    registry that lists them. Add a speech by adding a module and importing it
    there.
- **Unit and component tests** (Vitest, jsdom):

  ```bash
  npm test
  ```

  The IndexedDB logic is proven against `fake-indexeddb` with a fresh in-memory
  database per test, so indexing and pagination run deterministically without a
  browser and no state leaks between tests.

- **End-to-end tests** (Playwright) run against the production build inside the
  official Playwright container, which bundles the matching browsers:

  ```bash
  ./scripts/e2e.sh
  ```

  Transcription is stubbed in end-to-end tests through a small injection seam,
  so the suite is deterministic and never downloads the model. Each run starts
  from a clean browser profile, so there is no shared test state to reset. The
  real on-device transcription path is verified by hand in the browser.

## License

MIT. See [LICENSE](./LICENSE). Every bundled speech is a public-domain work.
Each speech module records its source and public-domain basis.
