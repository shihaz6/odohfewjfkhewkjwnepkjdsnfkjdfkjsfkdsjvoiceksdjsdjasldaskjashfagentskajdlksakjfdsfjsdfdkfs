# Alex — AlchemyX Global voice receptionist

LiveKit voice-call agent. Alex answers calls about AlchemyX Global and its products, takes
callback requests, and, when asked, says it's an AI built by AlchemyX (every call is a demo).

Runs on Groq for speech-to-text (Whisper), the LLM (`openai/gpt-oss-120b`) and
text-to-speech (Orpheus). Voice detection and turn detection run locally.

## Files

| File | What it is |
|---|---|
| `knowledge/alchemyx_facts.md` | Company fact sheet: the only facts Alex may use. Edit this to change what Alex knows. |
| `prompts/alex_instructions.md` | Alex's instructions. `{knowledge}` is replaced by the fact sheet at startup. |
| `agent.py` | The agent: greeting, models, and the `record_callback` tool. |
| `data/callbacks.jsonl` | Saved callback requests, one JSON line each (created on the first callback, not in git). |
| `tests/test_sheet.md` | The 30-question manual test sheet and round log. |
| `tests/test_alex.py` | The same 30 questions as automated tests, plus callback save and failure tests. |

## Docs

- [`docs/architecture.md`](docs/architecture.md): components, the voice pipeline, how a call flows, tools, deployment and testing
- [`docs/decisions.md`](docs/decisions.md): design decisions and why, grouped as major, medium and minor
- [`docs/limitations.md`](docs/limitations.md): what Alex can't do yet and the known risks, with fixes
- [`docs/pre-launch-checklist.md`](docs/pre-launch-checklist.md): the steps to finish before Alex takes real calls

## Teaser video

[`teaser/`](teaser/README.md) holds a Remotion project for the *Resonance by AlchemyX Global* teaser, in landscape and portrait.

## Setup (Windows)

Requires Python 3.10–3.13 (3.15 is not yet supported by `livekit-blingfire`).

```powershell
python -m pip install --user uv
python -m uv python install 3.12
python -m uv venv --python 3.12 .venv
python -m uv pip install --python .venv\Scripts\python.exe -r requirements.txt
.\.venv\Scripts\python.exe agent.py download-files
```

Copy `.env.example` to `.env.local` and fill in:
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`: LiveKit Cloud dashboard → Settings → API Keys
- `GROQ_API_KEY`: console.groq.com → API Keys

Groq's Orpheus TTS model requires accepting its terms once at
https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english

## Run

```cmd
run            :: connect to LiveKit Cloud (test in Sandbox -> Agents Playground)
run console    :: talk to Alex with your mic in the terminal
```

## Test

```cmd
.venv\Scripts\python.exe -m pytest tests -v
```

Each sheet question checks that Alex replies without calling a tool, in at most two
sentences, with no digits or markdown, and that an LLM judge (given the fact sheet) finds
the answer correct and free of invented facts. Groq's free tier allows 8,000 tokens per
minute per model, so a full run takes several minutes.
