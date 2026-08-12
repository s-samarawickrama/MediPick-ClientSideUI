from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "MediPick API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


settings = Settings()
