from fastapi import APIRouter

from app.mock_data import demo_user_profile

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me')
def get_current_user():
    return {'success': True, 'data': demo_user_profile()}


@router.patch('/me')
def update_user_profile():
    user = demo_user_profile()
    user.update({'email': 'new@email.com', 'surname': 'Perera'})
    return {'success': True, 'data': user}


@router.patch('/me/preferences')
def update_user_preferences():
    return {
        'success': True,
        'data': {
            'pushNotificationsEnabled': True,
            'emailReceiptsEnabled': False,
        },
    }


@router.patch('/me/phone')
def update_phone_number():
    return {'success': True, 'data': {'message': 'Phone number updated'}}


@router.post('/me/phone/verify')
def verify_phone_number():
    return {'success': True, 'data': {'message': 'Phone number verified'}}


@router.post('/me/push-token')
def register_push_token():
    return {'success': True, 'data': {'message': 'Push token saved'}}
