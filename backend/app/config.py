
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Absolute path to D:\PhishGuard\backend
BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        extra="ignore",
    )

    database_url: str = (
        "postgresql+psycopg2://phishguard:change-me@localhost:5432/phishguard"
    )

    secret_key: str

    cors_origins: str = (
        "http://localhost:5173,"
        "https://phish-guard-murex.vercel.app"
    )

    cookie_secure: bool = True

    access_token_minutes: int = 60
    max_upload_bytes: int = 5 * 1024 * 1024


settings = Settings()
