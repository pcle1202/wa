from dataclasses import dataclass

import httpx
from fastapi import HTTPException


GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"


@dataclass(slots=True)
class GeocodedLocation:
    query: str
    name: str
    admin1: str | None
    country: str | None
    country_code: str | None
    latitude: float
    longitude: float
    timezone: str | None


class GeocodingService:
    async def search_city(self, name: str, count: int = 5) -> list[dict]:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                GEOCODE_URL,
                params={"name": name, "count": count, "format": "json"},
            )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail="Geocoding provider request failed.") from exc

        results = response.json().get("results") or []
        return [self._serialize_location(query=name, item=item) for item in results]

    async def get_best_match(self, name: str) -> GeocodedLocation | None:
        results = await self.search_city(name=name, count=1)
        if not results:
            return None

        match = results[0]
        return GeocodedLocation(
            query=name,
            name=match["name"],
            admin1=match.get("admin1"),
            country=match.get("country"),
            country_code=match.get("country_code"),
            latitude=match["latitude"],
            longitude=match["longitude"],
            timezone=match.get("timezone"),
        )

    def _serialize_location(self, query: str, item: dict) -> dict:
        return {
            "query": query,
            "name": item.get("name"),
            "admin1": item.get("admin1"),
            "country": item.get("country"),
            "country_code": item.get("country_code"),
            "latitude": item.get("latitude"),
            "longitude": item.get("longitude"),
            "timezone": item.get("timezone"),
        }
