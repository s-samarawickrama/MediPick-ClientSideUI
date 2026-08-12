from pydantic import BaseModel, Field


class OrderCreateRequest(BaseModel):
    orderType: str = Field(
        ...,
        pattern='^(OTC|PRESCRIPTION)$',
        description='Order type for the current purchase.',
        examples=['OTC'],
    )
    pharmacyId: str = Field(
        ...,
        min_length=3,
        max_length=80,
        description='Pharmacy identifier for this order.',
        examples=['ph_1'],
    )
    items: list[dict] = Field(
        default_factory=list,
        description='Item list for the order. Each item contains medicine identifier and quantity.',
        examples=[[{'medicineId': 'med_1', 'quantity': 2}]],
    )
    paymentMethod: str = Field(
        default='PAY_AT_COUNTER',
        description='Selected payment method for the order.',
        examples=['PAY_AT_COUNTER'],
    )


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
    rating: int = Field(
        ...,
        ge=1,
        le=5,
        description='Customer rating from 1 to 5 stars.',
        examples=[5],
    )
    comment: str | None = Field(
        default=None,
        description='Optional customer review comment.',
        examples=['Very fast and helpful service.'],
    )


class RatingResponse(BaseModel):
    id: str
    rating: int
