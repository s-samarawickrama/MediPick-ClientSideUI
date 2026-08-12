from fastapi import APIRouter

from app.mock_data import demo_issue

router = APIRouter(prefix='/orders', tags=['issues'])


@router.post('/{order_id}/issues')
def create_issue(order_id: str):
    return {'success': True, 'data': demo_issue(order_id)}
