from fastapi import APIRouter

from app.mock_data import demo_cancelled_order, demo_order, demo_order_detail, demo_order_list
from app.schemas.orders import (
    CancelOrderResponse,
    OrderCreateRequest,
    OrderDetail,
    OrderSummary,
    RatingRequest,
    RatingResponse,
)

router = APIRouter(prefix='/orders', tags=['orders'])


@router.post('', response_model=OrderDetail)
def create_order(payload: OrderCreateRequest):
    order = demo_order(payload.orderType, payload.pharmacyId, payload.paymentMethod)
    order['items'] = payload.items
    return order


@router.get('', response_model=list[OrderSummary])
def list_orders():
    return demo_order_list()


@router.get('/{order_id}', response_model=OrderDetail)
def get_order(order_id: str):
    return demo_order_detail(order_id)


@router.post('/{order_id}/cancel', response_model=CancelOrderResponse)
def cancel_order(order_id: str):
    return demo_cancelled_order(order_id)


@router.post('/{order_id}/rating', response_model=RatingResponse)
def rate_order(order_id: str, payload: RatingRequest):
    return {'id': order_id, 'rating': payload.rating}
