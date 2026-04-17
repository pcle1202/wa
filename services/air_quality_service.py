import httpx
from fastapi import HTTPException


AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


class AirQualityService:
    CURRENT_FIELDS = [
        "european_aqi",
        "us_aqi",
        "pm10",
        "pm2_5",
        "uv_index",
        "alder_pollen",
        "birch_pollen",
        "grass_pollen",
        "mugwort_pollen",
        "olive_pollen",
        "ragweed_pollen",
    ]
    HOURLY_FIELDS = CURRENT_FIELDS

    async def fetch_air_quality(
        self,
        latitude: float,
        longitude: float,
        timezone: str,
        hourly_hours: int,
    ) -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": timezone,
            "current": ",".join(self.CURRENT_FIELDS),
            "hourly": ",".join(self.HOURLY_FIELDS),
            "forecast_hours": hourly_hours,
        }

        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.get(AIR_QUALITY_URL, params=params)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail="Air quality provider request failed.") from exc

        return response.json()
