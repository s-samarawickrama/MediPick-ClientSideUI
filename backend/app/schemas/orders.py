from pydantic import BaseModel, Field


class OrderCreateRequest(BaseModel):
    orderType: str = Field(..., pattern='^(OTC|PRESCRIPTION)$')
    pharmacyId: str = Field(..., min_length=3, max_length=80)
    items: list[dict] = Field(default_factory=list)
    paymentMethod: str = Field(default='PAY_AT_COUNTER')


class OrderSummary(BaseModel):
    id: str
    orderNumber: str
    orderType: str
    state: str
    totalAmount: float
    totalMrp: float
    isPaid: bool
    paymentMethod: str | None = None
    createdAt: str


class OrderDetail(OrderSummary):
    pharmacyId: str | None = None
    customerNote: str | None = None
    prescriptionId: str | None = None


class CancelOrderResponse(BaseModel):
    id: str
    state: str
    strikeAdded: bool
    customerStrikes: int


class RatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class RatingResponse(BaseModel):
    id: str
    rating: int
