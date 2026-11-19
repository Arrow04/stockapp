"""Portfolio API — thin controllers."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.portfolio_service import portfolio_service_holder

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

service = portfolio_service_holder


class HoldingIn(BaseModel):
    symbol: str
    qty: float
    avgPrice: float


@router.get("")
def list_holdings(user=Depends(get_current_user)):
    return service.list(user["email"])


@router.post("")
def add_holding(body: HoldingIn, user=Depends(get_current_user)):
    try:
        return service.add(user["email"], body.symbol, body.qty, body.avgPrice)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.put("/{hid}")
def update_holding(hid: int, body: HoldingIn, user=Depends(get_current_user)):
    try:
        return service.update(user["email"], hid, body.qty, body.avgPrice)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.delete("/{hid}")
def delete_holding(hid: int, user=Depends(get_current_user)):
    return service.delete(user["email"], hid)
