from packages.shared.config import SharedSettings


class Settings(SharedSettings):
    SERVICE_NAME: str = "ms-01-gateway-auth"
    WS_TICKET_EXPIRE_SECONDS: int = 60
    RATE_LIMIT_LOGIN_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 300


settings = Settings()
