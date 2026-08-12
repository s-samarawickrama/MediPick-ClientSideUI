from fastapi import APIRouter

from app.mock_data import demo_messages

router = APIRouter(prefix='/orders', tags=['chat'])


@router.get('/{order_id}/messages')
def get_messages(order_id: str):
    return {'success': True, 'data': demo_messages(order_id)}


@router.post('/{order_id}/messages')
def send_message(order_id: str):
    return {
        'success': True,
        'data': {
            'id': 'msg_002',
            'orderId': order_id,
            'senderRole': 'CUSTOMER',
            'text': 'Thank you! Can I collect around 5:30 PM?',
        },
    }
