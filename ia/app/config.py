from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_provider: str = "auto"
    llm_model: str = ""
    llm_base_url: str = ""
    llm_api_key: Optional[str] = None
    llm_timeout_seconds: float = 25.0

    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-3.1-flash-lite"
    gemini_base_url: str = ""

    allowed_origins: str = "http://localhost:5173,https://ritech-frontend-atwu.onrender.com"
    admin_token: Optional[str] = None

    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
