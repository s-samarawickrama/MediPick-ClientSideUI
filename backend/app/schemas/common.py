from pydantic import BaseModel


class SuccessResponse(BaseModel):
    success: bool = True


class ErrorDetail(BaseModel):
    code: str
    message: str
    fields: dict[str, str] | None = None
    data: dict | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
