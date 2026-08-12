from fastapi import APIRouter

from app.mock_data import demo_product, demo_products

router = APIRouter(prefix='/products', tags=['products'])


@router.get('')
def list_products():
    return {
        'success': True,
        'data': demo_products(),
        'meta': {
            'page': 1,
            'limit': 20,
            'total': 1,
            'totalPages': 1,
        },
    }


@router.get('/{product_id}')
def get_product(product_id: str):
    return {'success': True, 'data': demo_product(product_id)}
