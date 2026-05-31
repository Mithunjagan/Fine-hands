from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import ai, analytics, transactions, goals, notifications, onboard
from dotenv import load_dotenv
import time
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finehands")

app = FastAPI(
    title="Finehands Intelligent Financial System",
    description="Multi-dimensional financial health analysis with ML-powered insights",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Request logging middleware for debugging and monitoring."""
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response


# Register all routers
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(transactions.router)
app.include_router(goals.router)
app.include_router(notifications.router)
app.include_router(onboard.router)


@app.get("/")
def read_root():
    return {"status": "Finehands Intelligent System Active", "version": "3.0.0"}


@app.get("/api/health")
def health_check():
    """Health check endpoint for frontend connectivity verification."""
    return {"status": "ok", "timestamp": time.time()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=5005, reload=True)
