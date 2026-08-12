from fastapi import APIRouter

from app.mock_data import demo_auth_tokens, demo_user
from app.schemas.auth import AuthTokenResponse, OtpRequest, OtpResponse, OtpVerifyRequest

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/otp/request', response_model=OtpResponse)
def request_otp(payload: OtpRequest):
    return {
        'message': 'OTP sent to customer phone',
        'expiresIn': 300,
    }


@router.post('/otp/verify', response_model=AuthTokenResponse)
def verify_otp(payload: OtpVerifyRequest):
    tokens = demo_auth_tokens()
    user = demo_user()
    return {
        'accessToken': tokens['accessToken'],
        'refreshToken': tokens['refreshToken'],
        'user': user,
    }


@router.post('/otp/resend', response_model=OtpResponse)
def resend_otp(payload: OtpRequest):
    return {
        'message': 'OTP resent successfully',
        'expiresIn': 300,
    }


@router.post('/logout')
def logout():
    return {'success': True}
