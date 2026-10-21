"""Application configuration using Pydantic Settings."""

from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "VortiCast"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server & Routing
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_V1_STR: str = "/api/v1"

    # CORS
    ALLOWED_ORIGINS: list[str] | str = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ARTIFACTS_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "data/artifacts")
    DATA_RAW_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "data/raw")
    DATA_PROCESSED_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "data/processed")

    # Database
    DATABASE_URL: str = f"sqlite:///{Path(__file__).resolve().parent.parent.parent}/vorticast.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_database_url(cls, v: str) -> str:
        if v and v.startswith("sqlite:///./"):
            base = Path(__file__).resolve().parent.parent.parent
            return f"sqlite:///{base / v[len('sqlite:///./'):]}"
        return v

    @field_validator("ARTIFACTS_DIR", "DATA_RAW_DIR", "DATA_PROCESSED_DIR", mode="before")
    @classmethod
    def resolve_relative_paths(cls, v: str) -> str:
        if v and not Path(v).is_absolute():
            base = Path(__file__).resolve().parent.parent.parent
            return str((base / v).resolve())
        return v

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=[str(Path(__file__).resolve().parent.parent.parent / ".env"), ".env"],
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
