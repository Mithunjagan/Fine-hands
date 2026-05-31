from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from services.openrouter import stream_advice

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/advice/stream")
async def get_advice_stream(request: Request):
    data = await request.json()
    transactions = data.get("transactions", [])
    health_score = data.get("health_score", 500)
    unused_subs = data.get("unused_subs", 0)
    savings_rate = data.get("savings_rate", 0)
    query = data.get("query", "")
    
    return EventSourceResponse(stream_advice(transactions, health_score, unused_subs, savings_rate, query))
