"""Offline checks for the language switch (ALEX_LANGUAGE=en|si). No model calls, no quota."""

import os
import subprocess
import sys
from pathlib import Path

import pytest

import agent


def test_english_is_the_default_and_uses_groq():
    assert agent.build_stt("en")._opts.languages == ["en"]
    assert type(agent.build_tts("en")).__name__ == "TTS"


def test_sinhala_speech_in_uses_the_sinhala_code():
    assert agent.build_stt("si")._opts.languages == ["si"]


def test_sinhala_speech_out_needs_azure_keys(monkeypatch):
    monkeypatch.delenv("AZURE_SPEECH_KEY", raising=False)
    monkeypatch.delenv("AZURE_SPEECH_REGION", raising=False)
    with pytest.raises(RuntimeError, match="AZURE_SPEECH_KEY"):
        agent.build_tts("si")


def test_sinhala_speech_out_builds_with_azure_keys(monkeypatch):
    monkeypatch.setenv("AZURE_SPEECH_KEY", "test-key")
    monkeypatch.setenv("AZURE_SPEECH_REGION", "southindia")
    tts = agent.build_tts("si")
    assert tts._opts.voice == agent.SINHALA_VOICE


def test_every_language_has_a_greeting():
    assert set(agent.GREETINGS) == {"en", "si"}
    assert "AlchemyX Global" in agent.GREETINGS["si"]


def test_english_mode_never_asks_for_sinhala_replies(monkeypatch):
    monkeypatch.setattr(agent, "LANGUAGE", "en")
    text = agent.build_instructions()
    assert "Always reply in English" in text
    assert "{language_rule}" not in text


def test_sinhala_mode_replies_in_the_callers_language(monkeypatch):
    monkeypatch.setattr(agent, "LANGUAGE", "si")
    text = agent.build_instructions()
    assert "Reply in the language the caller speaks" in text
    assert "Always reply in English" not in text


def test_unknown_language_stops_the_worker_at_startup():
    root = Path(agent.ROOT)
    env = {**os.environ, "ALEX_LANGUAGE": "sinhala"}
    result = subprocess.run(
        [sys.executable, "-c", "import agent"],
        cwd=root,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "ALEX_LANGUAGE must be one of" in result.stderr
