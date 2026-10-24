from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://phishguard:change-me@localhost:5432/phishguard"
    secret_key: str  # required: no default so a missing secret fails loudly
    cors_origins: str = "http://localhost:5173"
    cookie_secure: bool = False  # set true behind HTTPS
    access_token_minutes: int = 60
    max_upload_bytes: int = 5 * 1024 * 1024


settings = Settings()
