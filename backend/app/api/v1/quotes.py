from fastapi import APIRouter

from app.mock_data import demo_quote

router = APIRouter(prefix='/orders', tags=['quotes'])


@router.get('/{order_id}/quote')
def get_quote(order_id: str):
    return {'success': True, 'data': demo_quote(order_id)}


@router.post('/{order_id}/quote/accept')
def accept_quote(order_id: str):
    return {
        'success': True,
        'data': {
            'id': order_id,
            'state': 'PREPARING',
        },
    }


@router.post('/{order_id}/quote/decline')
def decline_quote(order_id: str):
    return {
        'success': True,
        'data': {
            'id': order_id,
            'state': 'REJECTED',
        },
    }
