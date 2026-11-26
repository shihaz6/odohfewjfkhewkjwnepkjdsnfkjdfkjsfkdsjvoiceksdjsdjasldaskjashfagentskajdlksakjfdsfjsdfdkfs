"""Alex, the AlchemyX Global AI receptionist (LiveKit voice agent).

Groq STT -> Groq LLM -> Groq TTS, with local Silero VAD and local turn detection.
The company facts in knowledge/ are inserted into the prompt in prompts/ at startup.
"""

import json
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    RunContext,
    ToolError,
    function_tool,
    inference,
    room_io,
)
from livekit.agents.beta import EndCallTool
from livekit.plugins import azure, groq, noise_cancellation, silero

from dilu_tts import DiluTTS

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env.local")

KNOWLEDGE_FILE = ROOT / "knowledge" / "alchemyx_facts.md"
PROMPT_FILE = ROOT / "prompts" / "alex_instructions.md"
CALLBACKS_FILE = ROOT / "data" / "callbacks.jsonl"

AGENT_NAME = "alchemyx-alex"

# "en" (default) or "si". Sinhala uses Groq Whisper for speech in and Azure for speech out.
LANGUAGE = os.getenv("ALEX_LANGUAGE", "en").strip().lower()
SINHALA_VOICE = "si-LK-ThiliniNeural"

GREETINGS = {
    "en": "Hi, thanks for calling AlchemyX Global, this is Alex. How can I help you today?",
    "si": "ආයුබෝවන්, AlchemyX Global වෙතින් කතා කරන්නේ Alex. අද මම ඔබට උදව් කළ හැක්කේ කෙසේද?",
}
if LANGUAGE not in GREETINGS:
    raise ValueError(f"ALEX_LANGUAGE must be one of {sorted(GREETINGS)}, not {LANGUAGE!r}")

# Returned by end_call: the model speaks these final words, then the call is hung up.
END_INSTRUCTIONS = (
    "The call is ending now. Say your final words, in the caller's language, in at most two "
    "sentences: if you saved a "
    "callback request on this call, first repeat it back in one natural sentence (who, what "
    "they need, and for which business); then thank them for calling AlchemyX Global and "
    "say goodbye. A bare \"You're welcome, goodbye\" is not enough."
)

logger = logging.getLogger("alex")


LANGUAGE_RULES = {
    "en": (
        "- Always reply in English, even if the caller speaks another language. If you can't "
        "understand them, ask them to repeat in English."
    ),
    "si": (
        "- Always reply in Sinhala only, in Sinhala script, with no English words or sentences, "
        "even if the caller speaks English. Write brand names in Sinhala letters, every time: "
        "AlchemyX Global is ඇල්කෙමික්ස් "
        "ග්ලෝබල්, Catalyst is කැටලිස්ට්, "
        "Alex is ඇලෙක්ස්.\n"
        "- The company facts below are in English. Translate them naturally into Sinhala. "
        "Translating never adds a fact, number or promise that is not in the facts."
    ),
}


def build_instructions(caller_number: str | None = None) -> str:
    facts = KNOWLEDGE_FILE.read_text(encoding="utf-8")
    prompt = PROMPT_FILE.read_text(encoding="utf-8")
    # str.replace, not str.format, so braces in the facts can't break the prompt.
    text = prompt.replace("{language_rule}", LANGUAGE_RULES[LANGUAGE])
    text = text.replace("{knowledge}", facts)
    if caller_number:
        text += (
            "\n\nCALLER\n"
            f"- The caller is phoning from {caller_number}. When taking a callback, read this "
            "number back in words and ask if it is the best number to reach them."
        )
    else:
        text += (
            "\n\nCALLER\n"
            "- The caller's number is not available. When taking a callback, ask for the best "
            "number to reach them and read it back in words to confirm."
        )
    return text


def build_llm(**overrides) -> groq.LLM:
    # Low reasoning effort keeps the time to first word short on a call.
    return groq.LLM(model="openai/gpt-oss-120b", reasoning_effort="low", **overrides)


def build_stt(language: str = LANGUAGE):
    if language == "si":
        # Whisper with the Sinhala code instead of the default English.
        return groq.STT(model="whisper-large-v3-turbo", language="si")
    return groq.STT(model="whisper-large-v3-turbo")


def build_tts(language: str = LANGUAGE):
    if language == "si":
        # Groq's Orpheus voice is English-only. Sinhala speech is free and local (Dilu) by
        # default; set ALEX_TTS=azure to use Azure Speech instead.
        if os.getenv("ALEX_TTS", "dilu").strip().lower() == "azure":
            if not os.getenv("AZURE_SPEECH_KEY") or not os.getenv("AZURE_SPEECH_REGION"):
                raise RuntimeError(
                    "ALEX_TTS=azure needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local"
                )
            return azure.TTS(voice=SINHALA_VOICE, language="si-LK")
        return DiluTTS()
    return groq.TTS()


def normalize_phone(phone_number: str) -> str | None:
    """Digits of a plausible phone number, or None for empty or placeholder values."""
    digits = re.sub(r"\D", "", phone_number or "")
    if not 9 <= len(digits) <= 15 or len(set(digits)) < 3:
        return None
    return digits


def save_callback(record: dict) -> None:
    CALLBACKS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with CALLBACKS_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


class Alex(Agent):
    def __init__(self, caller_number: str | None = None) -> None:
        super().__init__(
            instructions=build_instructions(caller_number),
            tools=[
                # Speaks the goodbye from END_INSTRUCTIONS, then deletes the room,
                # which hangs up phone (SIP) callers too.
                EndCallTool(
                    end_instructions=END_INSTRUCTIONS,
                    delete_room=True,
                    ignore_on_enter=True,
                    extra_description=(
                        "Also call it when the caller says thanks and goodbye after their "
                        "questions are answered. Do not call it when they ask you to hold on "
                        "or wait, or when they say thanks but are still asking questions."
                    ),
                )
            ],
        )
        self._caller_number = caller_number

    @function_tool
    async def record_callback(
        self,
        context: RunContext,
        name: str,
        business_type: str,
        need: str,
        phone_number: str,
    ) -> str:
        """Save a callback request for the AlchemyX team. Call this only once you have the
        caller's name, business type and need, and the caller has confirmed the phone number.
        Never make up or use a placeholder number.

        Args:
            name: The caller's name.
            business_type: The caller's type of business, for example tuition class or pharmacy.
            need: What the caller needs, in a few words.
            phone_number: The number the caller confirmed, as digits only.
        """
        missing = [
            label
            for label, value in (
                ("their name", name),
                ("their type of business", business_type),
                ("what they need", need),
            )
            if not (value or "").strip()
        ]
        if missing:
            raise ToolError(
                f"Not saved: missing {', '.join(missing)}. Ask the caller for one or two of "
                "these, then save again once you have everything."
            )

        phone = normalize_phone(phone_number) or (
            normalize_phone(self._caller_number) if not phone_number else None
        )
        if not phone:
            raise ToolError(
                "Not saved: no valid phone number. Ask the caller for the best number to "
                "reach them, read it back in words, and save again once they confirm."
            )

        record = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "name": name.strip(),
            "business_type": business_type.strip(),
            "need": need.strip(),
            "phone_number": phone,
            "caller_id": self._caller_number,
        }
        try:
            save_callback(record)
        except OSError as e:
            logger.exception("failed to save callback request")
            raise ToolError(
                "Not saved because of a system error. Tell the caller plainly that you "
                "couldn't save their callback request just now, do not say the team will "
                "call them, and suggest they message AlchemyX Global on Facebook, Instagram, "
                "TikTok or LinkedIn instead."
            ) from e
        logger.info("callback saved: %s", record)
        return (
            "Saved. Tell the caller the team will contact them. When the caller ends the call, "
            "use end_call; your final words will then repeat this request back, for example: "
            f'"So the team will call {record["name"]} about {record["need"]} for your '
            f'{record["business_type"]}. Thanks for calling AlchemyX Global, goodbye!"'
        )


def find_caller_number(room) -> str | None:
    # Set for phone (SIP) callers; absent for browser callers such as the Agents Playground.
    try:
        for p in room.remote_participants.values():
            if number := p.attributes.get("sip.phoneNumber"):
                return number
    except Exception:  # console mode has no real room
        pass
    return None


async def entrypoint(ctx: agents.JobContext):
    alex = Alex()
    session = AgentSession(
        stt=build_stt(),
        llm=build_llm(),
        tts=build_tts(),
        vad=silero.VAD.load(),
        # Pinned to the local model. Left on auto, it uses LiveKit Inference's
        # hosted "v1" model in console/dev mode or when deployed to LiveKit Cloud.
        turn_detection=inference.TurnDetector(version="v1-mini"),
    )

    await session.start(
        room=ctx.room,
        agent=alex,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                # BVCTelephony is tuned for phone-call (SIP) audio.
                noise_cancellation=noise_cancellation.BVCTelephony(),
            ),
        ),
    )

    if caller_number := find_caller_number(ctx.room):
        alex._caller_number = caller_number
        await alex.update_instructions(build_instructions(caller_number))

    # Fixed greeting: no LLM round trip, and always names AlchemyX Global.
    session.say(GREETINGS[LANGUAGE])


if __name__ == "__main__":
    # A named agent is only sent to rooms that explicitly request it (a dispatch rule,
    # a token, or the API), not to every new room.
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint, agent_name=AGENT_NAME))
