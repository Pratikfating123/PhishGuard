from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routers import analysis, auth, dashboard, emails, quarantine

app = FastAPI(title="PhishGuard AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    # Never leak internals. Details belong in server logs.
    return JSONResponse({"detail": "Something went wrong on the server."}, status_code=500)


for r in (auth, emails, analysis, quarantine, dashboard):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    from .routers.analysis import _model
    return {"status": "ok", "model_available": _model.available, "model_version": _model.version}
