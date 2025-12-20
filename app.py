from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/geocode")
async def geocode(name: str, count: int = 5):
    # Open-Meteo Geocoding API: /v1/search?name=... :contentReference[oaicite:3]{index=3}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(GEOCODE_URL, params={"name": name, "count": count, "format": "json"})
        r.raise_for_status()
        data = r.json()

    results = data.get("results") or []
    return [
        {
            "name": x.get("name"),
            "admin1": x.get("admin1"),
            "country": x.get("country"),
            "latitude": x.get("latitude"),
            "longitude": x.get("longitude"),
            "timezone": x.get("timezone"),
        }
        for x in results
    ]

@app.get("/api/weather")
async def weather(lat: float, lon: float):
    # Open-Meteo Forecast API docs :contentReference[oaicite:4]{index=4}
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "hourly": "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(FORECAST_URL, params=params)
        r.raise_for_status()
        data = r.json()

    # Return only what the frontend needs (keeps payload small)
    if "current" not in data:
        raise HTTPException(status_code=502, detail="Weather provider did not return current weather.")

    return {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timezone": data.get("timezone"),
        "current_units": data.get("current_units"),
        "current": data.get("current"),
        "hourly_units": data.get("hourly_units"),
        "hourly": {
            "time": (data.get("hourly") or {}).get("time", [])[:24],
            "temperature_2m": (data.get("hourly") or {}).get("temperature_2m", [])[:24],
            "precipitation_probability": (data.get("hourly") or {}).get("precipitation_probability", [])[:24],
            "weather_code": (data.get("hourly") or {}).get("weather_code", [])[:24],
            "wind_speed_10m": (data.get("hourly") or {}).get("wind_speed_10m", [])[:24],
        },
        "daily_units": data.get("daily_units"),
        "daily": data.get("daily"),
    }
