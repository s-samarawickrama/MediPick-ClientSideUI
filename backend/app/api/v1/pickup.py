from fastapi import APIRouter

from app.mock_data import demo_pickup

router = APIRouter(prefix='/orders', tags=['pickup'])


@router.get('/{order_id}/pickup')
def get_pickup(order_id: str):
    return {'success': True, 'data': demo_pickup(order_id)}


@router.post('/{order_id}/pickup/extend')
def extend_pickup(order_id: str):
    return {
        'success': True,
        'data': {
            'orderId': order_id,
            'pickupDeadline': '2026-08-14T18:00:00Z',
        },
    }
