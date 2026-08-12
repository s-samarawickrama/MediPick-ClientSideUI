from fastapi import APIRouter

from app.mock_data import demo_prescription, demo_prescription_detail, demo_prescription_status

router = APIRouter(prefix='/prescriptions', tags=['prescriptions'])


@router.post('')
def create_prescription():
    return {'success': True, 'data': demo_prescription()}


@router.get('/{prescription_id}')
def get_prescription(prescription_id: str):
    return {'success': True, 'data': demo_prescription_detail(prescription_id)}


@router.get('/{prescription_id}/status')
def get_prescription_status(prescription_id: str):
    return {'success': True, 'data': demo_prescription_status(prescription_id)}
