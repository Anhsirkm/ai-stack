from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file="../.env", extra="ignore")

    # Postgres
    database_url: str = "postgresql+asyncpg://aistack:aistack123@localhost:5432/aistack"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma3:4b"
    ollama_embed_model: str = "nomic-embed-text"

    # App
    environment: str = "development"
    log_level: str = "INFO"


settings = Settings()