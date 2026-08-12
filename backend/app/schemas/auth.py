from pydantic import BaseModel, EmailStr, Field


class OtpRequest(BaseModel):
    phoneNumber: str = Field(
        ...,
        min_length=9,
        max_length=15,
        description='Sri Lankan mobile number for OTP login.',
        examples=['0771234567'],
    )
    surname: str = Field(
        ...,
        min_length=2,
        max_length=80,
        description='Customer surname used during OTP signup.',
        examples=['Perera'],
    )
    email: EmailStr | None = Field(
        default=None,
        description='Optional customer email address.',
        examples=['perera@gmail.com'],
    )


class OtpVerifyRequest(BaseModel):
    phoneNumber: str = Field(
        ...,
        min_length=9,
        max_length=15,
        description='The same mobile number used when requesting the OTP.',
        examples=['0771234567'],
    )
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description='6-digit OTP received by the customer.',
        examples=['123456'],
    )


class OtpResponse(BaseModel):
    message: str
    expiresIn: int = 300


class AuthTokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: dict
