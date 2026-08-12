from pydantic import BaseModel, EmailStr, Field


class OtpRequest(BaseModel):
    phoneNumber: str = Field(..., min_length=9, max_length=15)
    surname: str = Field(..., min_length=2, max_length=80)
    email: EmailStr | None = None


class OtpVerifyRequest(BaseModel):
    phoneNumber: str = Field(..., min_length=9, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6)


class OtpResponse(BaseModel):
    message: str
    expiresIn: int = 300


class AuthTokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: dict
