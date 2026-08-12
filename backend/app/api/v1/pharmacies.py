from fastapi import APIRouter

from app.mock_data import demo_pharmacies, demo_pharmacy

router = APIRouter(prefix='/pharmacies', tags=['pharmacies'])


@router.get('')
def list_pharmacies():
    return {
        'success': True,
        'data': demo_pharmacies(),
        'meta': {
            'page': 1,
            'limit': 10,
            'total': 1,
            'totalPages': 1,
        },
    }


@router.get('/{pharmacy_id}')
def get_pharmacy(pharmacy_id: str):
    return {'success': True, 'data': demo_pharmacy(pharmacy_id)}


@router.post('/{pharmacy_id}/favorites')
def add_favorite(pharmacy_id: str):
    return {'success': True, 'data': {'favoriteId': 'fav_123'}}


@router.delete('/{pharmacy_id}/favorites/{favorite_id}')
def remove_favorite(pharmacy_id: str, favorite_id: str):
    return {'success': True}
