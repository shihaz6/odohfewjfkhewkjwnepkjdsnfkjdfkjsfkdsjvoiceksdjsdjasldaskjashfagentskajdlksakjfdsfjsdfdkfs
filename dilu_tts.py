"""Dilu: free, local Sinhala text-to-speech for LiveKit Agents.

Uses the Piper voice si_LK-dilu-medium (MIT licence, Hugging Face: chaturadilan/dilu-tts).
Runs on the CPU, so it needs no key and no quota. The model file lives in models/ and is
not committed to git.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from piper import PiperVoice

from livekit.agents import APIConnectOptions, tts, utils
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS

MODEL_PATH = Path(__file__).resolve().parent / "models" / "si_LK-dilu-medium.onnx"


class DiluTTS(tts.TTS):
    def __init__(self, model_path: str | Path = MODEL_PATH) -> None:
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Dilu voice not found at {model_path}. Download si_LK-dilu-medium.onnx and its "
                ".onnx.json from huggingface.co/chaturadilan/dilu-tts into models/."
            )
        self._voice = PiperVoice.load(
            str(model_path), config_path=str(model_path) + ".json"
        )
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=self._voice.config.sample_rate,
            num_channels=1,
        )

    @property
    def model(self) -> str:
        return "si_LK-dilu-medium"

    @property
    def provider(self) -> str:
        return "Piper"

    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
    ) -> _DiluChunkedStream:
        return _DiluChunkedStream(tts=self, input_text=text, conn_options=conn_options)


class _DiluChunkedStream(tts.ChunkedStream):
    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        tts_obj: DiluTTS = self._tts  # type: ignore[assignment]
        voice = tts_obj._voice
        text = self._input_text

        # Piper is CPU-bound, so render in a worker thread. Rendering on the event loop
        # stalls audio and turn handling.
        def render() -> list[bytes]:
            return [chunk.audio_int16_bytes for chunk in voice.synthesize(text)]

        chunks = await asyncio.to_thread(render)

        output_emitter.initialize(
            request_id=utils.shortuuid(),
            sample_rate=tts_obj.sample_rate,
            num_channels=1,
            mime_type="audio/pcm",
        )
        for data in chunks:
            output_emitter.push(data)
        output_emitter.flush()
