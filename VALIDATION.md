# VALIDATION — Franklin's Podium: rebuild the great speeches out loud

## Verdict: VIABLE

Viable as value, with three named risks that must be treated as binding
design constraints by the planner and builders, not as footnotes. The
premortem's strongest objection (the feedback instrument measures
memorization, not speaking) is a real trap, but it is a design failure
mode to avoid, not a structural property of the idea. The judgment below
explains where the line is.

## Core value proposition

A person whose thinking outruns their mouth gets a repeatable,
private, deliberate-practice loop for composing speech under pressure:
condense a great oration into one-line hints, wait days until verbatim
memory fades, deliver a reconstruction aloud, and study your own spoken
sentences laid beside the master's. Everything runs in the browser on
the user's device. No account, no upload, no server. The value is the
first time "I speak worse than I think" turns into a specific, visible
list of moves the original made and you didn't.

## Does it survive the substitution test?

**Versus a chatbot (including voice mode):** yes. A chatbot can produce
hints and even eyeball a comparison, but it cannot hold the loop's
mechanism: the enforced multi-day forgetting gap, a stable
sentence-aligned study surface, and an archive of attempts that
accumulates across months. The user would have to supply the discipline
the tool exists to be. Decisively: the loop here needs no LLM at all at
runtime, so there is no chatbot component to substitute out.

**Versus free incumbents:** yes, narrowly but genuinely. Yoodli and
kin coach delivery (filler words, pace) with no reference text and no
spaced loop; recitation checkers (Tarteel, line-running apps) enforce
the inverse loop, punishing deviation from a text where Franklin's
exercise requires deviation. Nothing shipped, free or paid, runs
reconstruction-after-delay as practice. The premortem's SpeechShot
claim (offline record-vs-text diffing) describes recitation checking,
the wrong loop, even if the tool exists.

**Does it leave something durable?** Yes, and this is the strongest part
of the idea: the attempt archive (every reconstruction with its aligned
diff, redoable months later against your own earlier attempt) and the
stolen-phrases ledger (rhetorical moves lifted from the diffs, tagged by
source speech). Because it is all client-side, the artifact is
exportable and literally the user's.

## Can agents deliver it at the quality bar?

Yes, and unusually cleanly. The load-bearing technical premise is
verified in the wild: Whisper runs in-browser via transformers.js with
WebGPU and a WASM fallback (xenova/whisper-web is a working open-source
implementation). Hint decks for a curated public-domain library are
generated at build time by the agents themselves and shipped as static
data. Sentence alignment is deterministic code, optionally sharpened by
on-device embeddings. There is no server, no runtime LLM, no BYOK
surface needed, no moderation, no ops. This is close to the ideal
agent-buildable shape: all the intelligence is either build-time or
deterministic.

## Main risks (carry these into the plan as constraints)

1. **The feedback instrument must reward paraphrase, or the product is
   a memorization quiz wearing a coaching costume.** This is the
   premortem's headline and it is correct as a warning. A naive
   red/green word diff punishes exactly what Franklin's method
   cultivates: re-composition in your own words. The alignment surface
   must be built as a tolerant, sentence-level study object: align by
   meaning (position plus lexical overlap plus, ideally, on-device
   embedding similarity), present the pairs side by side neutrally, and
   let the user judge the gap. It must never render a percentage score,
   a pass/fail state, or word-level red ink on paraphrase. If the build
   ships a verbatim-recall diff, the product fails even if every test
   passes. This belongs in EPIC acceptance criteria, verbatim.

2. **On-device transcription of nervous, free-composed speech is the
   riskiest premise, and it must be probed in EPIC 1, not discovered in
   polish.** Browser-sized Whisper models mis-transcribe hesitant,
   accented, quiet speakers, and every transcription error renders as a
   gap blamed on the speaker, worst for exactly the users this targets.
   Mitigations exist (show the transcript for one-tap correction before
   aligning, prefer the small model on WebGPU, treat filler words and
   restarts as noise to strip, keep the audio locally replayable so the
   user can spot-check any flagged line), but the first build must
   validate the diff-fidelity claim on real hesitant speech early. If a
   large share of flagged gaps trace to the transcriber rather than the
   speaker, the honest fallback is a typed-reconstruction mode with
   speaking as the input option, and that finding must be reported, not
   papered over.

3. **The return loop is fragile in a no-account browser tool.** The
   mechanic requires the user to come back days later, with no reminder
   channel, after a day-one experience that is mostly cost (model
   download, hint study, no payoff yet). Mitigations are cheap and must
   be planned: make day one deliver value on its own (the hint-making
   act itself, plus a short same-day warm-up round so the user
   experiences the alignment surface immediately), keep the enforced
   gap for the real attempt, offer a calendar-file reminder, and make
   the model download a background task with honest progress. Retention
   cannot be engineered away entirely; this product's ceiling depends
   on a minority temperament that practices deliberately, and that is
   acceptable under the factory's value-not-revenue purpose.

Secondary, manageable: corpus copyright (build the library only from
pre-1929 and US-government works, checked speech-by-speech at build
time); 40-200 MB first-load model with a designed progress and caching
story; mic permission and the courage barrier of speaking alone (the
on-device guarantee is the mitigation, and it must be stated plainly in
the UI).

## Why the premortem's 0.9 does not kill it

The premortem prices in product-market success; the factory's bar is
durable user value and portfolio variance. Three of its five risks
(feedback falseness, transcription ceiling, return loop) are design
constraints this validation converts into binding requirements. The
audience-mismatch risk (reconstructing archaic oratory may not transfer
to modern improvisation) is partially true but overweighted: the HN
thread's top answer was literally Franklin's exercise, users
self-selected into wanting exactly this practice, and paste-your-own-text
mode lets a user run the loop on modern material (a design doc, their
own talk notes) with deterministic hint extraction. The substitution
risk is answered above. What remains is honest uncertainty about
retention, which every deliberate-practice tool carries and which does
not make the value fake for the users who do return.

## Ambition check

Passes the obvious-answer test: the obvious product here is another
AI delivery coach or a flashcard app; this is neither. The signature
moment is nameable in one sentence: you speak from memory into your
laptop, nothing leaves the machine, and seconds later your own sentences
sit aligned beside Lincoln's with the gaps visible. The mechanic
(enforced forgetting as a feature, diff as study object) is genuinely
uncommon, and the value compounds through the archive and ledger.

## What would make me reject it

- If in-browser Whisper did not exist as a working, cacheable artifact
  (it does), or if the EPIC 1 probe shows most flagged gaps on hesitant
  real speech are transcription artifacts with no viable correction UX.
- If the plan drifts toward delivery scoring (pace, filler-word counts,
  grades), which puts it in Yoodli's territory and abandons the one gap
  it uniquely fills.
- If the alignment surface cannot be built without punishing paraphrase,
  turning the loop into recitation checking.
- If the public-domain corpus turned out too thin to matter (it is not:
  Lincoln, Douglass, Truth, Henry, Cicero, and pre-1929 translations are
  ample).

## Notes for the planner

- EPIC 1 should be, in effect, the dossier's probe: one speech, one
  pre-baked hint deck, record, on-device transcription, tolerant
  alignment, plus the staging deploy scaffold. The riskiest premise gets
  tested by the first reviewable unit.
- The multi-day gap needs a same-day warm-up variant so first-run value
  exists before the wait, and so staging demos show the differentiator
  within a minute.
- Non-goals should explicitly fence out: delivery metrics, accounts and
  server storage, cloud transcription, the "Podium Shadow" pitch-contour
  sibling, and any scoring or grading of attempts.
