
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routers import analysis, auth, dashboard, emails, quarantine


app = FastAPI(title="PhishGuard AI API", version="0.1.0")


# Read and normalize configured CORS origins.
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

# Explicitly allow the deployed Vercel frontend.
frontend_origin = "https://phish-guard-murex.vercel.app"

if frontend_origin not in allowed_origins:
    allowed_origins.append(frontend_origin)


# Configure CORS for cross-origin requests and cookie authentication.
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Content-Type",
        "X-CSRF-Token",
    ],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"

    return response


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    # Keep internal exception details out of client responses.
    return JSONResponse(
        {"detail": "Something went wrong on the server."},
        status_code=500,
    )


# Register API routers.
for router in (auth, emails, analysis, quarantine, dashboard):
    app.include_router(router.router)


@app.get("/api/health")
def health():
    from .routers.analysis import _model

    return {
        "status": "ok",
        "model_available": _model.available,
        "model_version": _model.version,
    }
