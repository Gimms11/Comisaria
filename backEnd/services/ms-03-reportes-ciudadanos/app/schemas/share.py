from pydantic import BaseModel, Field


class ShareEventRequest(BaseModel):
    platform: str = Field("whatsapp", description="whatsapp, facebook, instagram, twitter, other")


class ShareCountResponse(BaseModel):
    public_code: str
    shares_count: int
    status: str = "recorded"
