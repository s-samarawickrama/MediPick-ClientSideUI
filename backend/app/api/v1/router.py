from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.pharmacies import router as pharmacies_router
from app.api.v1.products import router as products_router
from app.api.v1.users import router as users_router
from app.api.v1.prescriptions import router as prescriptions_router
from app.api.v1.orders import router as orders_router
from app.api.v1.quotes import router as quotes_router
from app.api.v1.pickup import router as pickup_router
from app.api.v1.chat import router as chat_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.issues import router as issues_router
from app.api.v1.payments import router as payments_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(pharmacies_router)
api_router.include_router(products_router)
api_router.include_router(users_router)
api_router.include_router(prescriptions_router)
api_router.include_router(orders_router)
api_router.include_router(quotes_router)
api_router.include_router(pickup_router)
api_router.include_router(chat_router)
api_router.include_router(notifications_router)
api_router.include_router(issues_router)
api_router.include_router(payments_router)
