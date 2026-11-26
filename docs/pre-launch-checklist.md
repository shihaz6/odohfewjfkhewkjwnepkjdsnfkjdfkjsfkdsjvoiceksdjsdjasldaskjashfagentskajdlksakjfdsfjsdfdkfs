# Pre-launch checklist

The steps that must be done before Alex takes calls from real callers. Each one maps to an
item in [`limitations.md`](limitations.md). Tick a box once it is done and verified.

## Must do before a public phone number

- [ ] **L5. Rotate the exposed keys.** Rotate the LiveKit API key and secret and the Groq key,
  then:
  - update `.env.local`;
  - run `lk agent update --secrets GROQ_API_KEY=...` (with the new key);
  - remove the stale `lk` CLI project entry, whose key returns 401.
- [ ] **L4. Recording disclosure.** Sign in with `lk cloud auth` and check whether agent
  observability (transcripts and audio) is on. If it is on, add a short notice to the greetings
  in `GREETINGS` in `agent.py` and decide how long recordings are kept. Sri Lanka's Personal Data Protection Act
  applies.
- [ ] **L3. Durable callback store.** `save_callback()` writes to the container's temporary
  filesystem, so requests are lost on redeploy. Choose a destination (a Google Sheet, a CRM, or
  a WhatsApp or email alert), then replace `save_callback()` with it. Decide the destination
  first; it is a business choice.
- [ ] **L2. Phone number.** Buy a SIP trunk or a LiveKit phone number, then add a dispatch rule
  that names `alchemyx-alex` (see decision M4).
- [ ] **L1. Fallback providers.** Move Groq to a paid tier, and add `llm.FallbackAdapter` (and
  STT/TTS fallbacks) with a second provider, so a Groq outage does not leave the caller in
  silence.

## Sinhala mode (`ALEX_LANGUAGE=si`)

- [ ] **Azure Speech account.** Create an Azure Speech resource, then set `AZURE_SPEECH_KEY` and
  `AZURE_SPEECH_REGION` in `.env.local`. Confirm the voice `si-LK-ThiliniNeural` exists in that region.
- [ ] **Speech recognition test.** Record 15 to 20 Sinhala caller lines on a phone line (questions,
  a name, a business name, a phone number). Run them through Whisper with `language="si"` and
  score the transcripts. If accuracy is poor, choose another speech-to-text provider.
- [ ] **Speech output test.** Listen to 10 Sinhala replies from Azure. Check pronunciation of
  brand names and numbers, and check the speed.
- [ ] **Turn detection test.** Check that Alex does not cut callers off mid-sentence in Sinhala. If
  it does, look at the turn detector for multilingual support.
- [ ] **Native speaker review.** Ask a native Sinhala speaker to check the greeting in
  `GREETINGS["si"]` and 20 replies from the Sinhala test run. Check for wrong facts and awkward phrasing.
- [ ] **Sinhala test sheet.** Translate the 30 questions in `tests/test_sheet.md` into Sinhala
  caller lines, then run them in Sinhala mode.
- [ ] **Latency.** Measure time to first word on a real call. Sinhala TTS may be slower than Orpheus.

## Check after each release

- [ ] `.\.venv\Scripts\python.exe -m pytest tests -v` passes (uses Groq quota; run at a quiet time).
- [ ] `docker build` excludes `.env.*`, `docs/`, `teaser/`, `tests/` and `*.mp3`.
- [ ] `lk agent deploy --yes`, then `lk agent status` shows the new version running.
- [ ] One test call in the Agents Playground: greeting, one question, a callback, and goodbye.
