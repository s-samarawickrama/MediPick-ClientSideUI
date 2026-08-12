from fastapi import APIRouter

from app.mock_data import demo_payment_intent

router = APIRouter(prefix='/payments', tags=['payments'])


@router.post('/intents')
def create_payment_intent():
    return {'success': True, 'data': demo_payment_intent()}
