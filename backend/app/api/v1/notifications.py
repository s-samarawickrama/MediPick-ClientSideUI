from fastapi import APIRouter

from app.mock_data import demo_notification, demo_notification_list

router = APIRouter(prefix='/notifications', tags=['notifications'])


@router.get('')
def list_notifications():
    return {'success': True, 'data': demo_notification_list()}


@router.patch('/{notification_id}')
def mark_notification_read(notification_id: str):
    return {'success': True, 'data': demo_notification(notification_id)}
