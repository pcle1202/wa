from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.weather import router as weather_router


app = FastAPI(
    title="Weather Based Life Assistant API",
    description="Backend API for the Weather Based Life Assistant dashboard.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(weather_router)


@app.get("/")
async def root() -> dict:
    return {
        "app": "Weather Based Life Assistant API",
        "phase": "complete",
        "status": "running",
        "available_routes": {
            "health": "/health",
            "geocode": "/api/geocode?name=Boston",
            "weather": "/api/weather?city=Boston&unit=metric",
            "recommendations": "/api/recommendations?city=Boston&unit=metric",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
