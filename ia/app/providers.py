import json
import re

import httpx

from .config import Settings


class LLMProvider:
    name = "llm"
    model = ""

    def generate(self, prompt: str) -> str:
        raise NotImplementedError


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, settings: Settings) -> None:
        self.base = (settings.gemini_base_url or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        self.model = settings.gemini_model or "gemini-3.1-flash-lite"
        self.key = settings.gemini_api_key or settings.llm_api_key or ""
        self.timeout = settings.llm_timeout_seconds

    def generate(self, prompt: str) -> str:
        r = httpx.post(
            f"{self.base}/models/{self.model}:generateContent",
            headers={"x-goog-api-key": self.key},
            json={
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024},
            },
            timeout=self.timeout,
        )
        r.raise_for_status()
        parts = r.json()["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts).strip()


class OpenAICompatibleProvider(LLMProvider):
    name = "openai_compatible"

    def __init__(self, settings: Settings) -> None:
        self.base = (settings.llm_base_url or "https://api.groq.com/openai/v1").rstrip("/")
        self.model = settings.llm_model or "llama-3.1-8b-instant"
        self.key = settings.llm_api_key
        self.timeout = settings.llm_timeout_seconds

    def generate(self, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {self.key}"} if self.key else {}
        r = httpx.post(
            f"{self.base}/chat/completions",
            headers=headers,
            json={"model": self.model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.3, "max_tokens": 600},
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


class RulesProvider:
    name = "reglas"
    model = ""


def build_provider(settings: Settings):
    name = settings.llm_provider
    if name == "auto":
        name = "gemini" if settings.gemini_api_key else "reglas"
    if name == "gemini":
        return GeminiProvider(settings)
    if name == "openai_compatible":
        return OpenAICompatibleProvider(settings)
    return RulesProvider()


def provider_label(provider) -> str:
    return f"{provider.name}:{provider.model}" if provider.model else provider.name


def parse_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("El modelo no devolvio JSON")
    return json.loads(match.group(0))
