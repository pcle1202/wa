import asyncio
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query

from schemas.recommendations import RecommendationsResponseSchema, UserPreferencesSchema
from schemas.weather import NormalizedWeatherResponse
from services.air_quality_service import AirQualityService
from services.commute_engine import CommuteEngine
from services.event_engine import EventEngine
from services.geocoding_service import GeocodingService
from services.health_engine import HealthEngine
from services.outfit_engine import OutfitEngine
from services.scoring_service import ScoringService
from services.weather_service import WeatherService


router = APIRouter(tags=["weather"])

geocoding_service = GeocodingService()
weather_service = WeatherService()
air_quality_service = AirQualityService()
scoring_service = ScoringService()
outfit_engine = OutfitEngine()
health_engine = HealthEngine()
commute_engine = CommuteEngine()
event_engine = EventEngine()


@router.get("/api/geocode")
async def geocode_city(
    name: str = Query(..., min_length=2),
    count: int = Query(5, ge=1, le=10),
) -> list[dict]:
    return await geocoding_service.search_city(name=name, count=count)


@router.get("/api/weather", response_model=NormalizedWeatherResponse)
async def get_weather(
    city: str = Query(..., min_length=2, description="City name to geocode and fetch."),
    unit: str = Query("metric", pattern="^(metric|imperial)$"),
    hourly_hours: int = Query(24, ge=6, le=72),
    daily_days: int = Query(7, ge=1, le=14),
) -> NormalizedWeatherResponse:
    return await _load_normalized_weather(
        city=city,
        unit=unit,
        hourly_hours=hourly_hours,
        daily_days=daily_days,
    )


@router.get("/api/recommendations", response_model=RecommendationsResponseSchema)
async def get_recommendations(
    city: str = Query(..., min_length=2),
    unit: str = Query("metric", pattern="^(metric|imperial)$"),
    hourly_hours: int = Query(24, ge=6, le=72),
    daily_days: int = Query(7, ge=1, le=14),
    skin_sensitivity: bool = Query(False),
    allergy_sensitivity: bool = Query(False),
    pollution_sensitivity: bool = Query(False),
    preferred_commute_mode: str = Query("mixed", pattern="^(mixed|walk|bike|drive|transit)$"),
    outfit_formality: str = Query("casual", pattern="^(casual|smart|active)$"),
) -> RecommendationsResponseSchema:
    weather = await _load_normalized_weather(
        city=city,
        unit=unit,
        hourly_hours=hourly_hours,
        daily_days=daily_days,
    )
    preferences = UserPreferencesSchema(
        unit_system=unit,
        skin_sensitivity=skin_sensitivity,
        allergy_sensitivity=allergy_sensitivity,
        pollution_sensitivity=pollution_sensitivity,
        preferred_commute_mode=preferred_commute_mode,
        outfit_formality=outfit_formality,
    )

    return RecommendationsResponseSchema(
        location=weather.location,
        generated_at=datetime.now(UTC),
        unit_system=unit,
        preferences=preferences,
        scores=scoring_service.score_overview(weather),
        outfit=outfit_engine.generate(weather, outfit_formality=outfit_formality),
        health=health_engine.generate(
            weather,
            skin_sensitivity=skin_sensitivity,
            allergy_sensitivity=allergy_sensitivity,
            pollution_sensitivity=pollution_sensitivity,
        ),
        commute=commute_engine.generate(weather, preferred_mode=preferred_commute_mode),
        events=event_engine.generate(weather),
    )


async def _load_normalized_weather(
    city: str,
    unit: str,
    hourly_hours: int,
    daily_days: int,
) -> NormalizedWeatherResponse:
    location = await geocoding_service.get_best_match(city)
    if location is None:
        raise HTTPException(status_code=404, detail=f"No geocoding results found for '{city}'.")

    weather_task = weather_service.fetch_weather(
        latitude=location.latitude,
        longitude=location.longitude,
        timezone=location.timezone or "auto",
        unit=unit,
        hourly_hours=hourly_hours,
        daily_days=daily_days,
    )
    air_quality_task = air_quality_service.fetch_air_quality(
        latitude=location.latitude,
        longitude=location.longitude,
        timezone=location.timezone or "auto",
        hourly_hours=hourly_hours,
    )

    weather_data, air_quality_data = await asyncio.gather(weather_task, air_quality_task)
    return weather_service.normalize_response(
        location=location,
        weather_data=weather_data,
        air_quality_data=air_quality_data,
        hourly_hours=hourly_hours,
        daily_days=daily_days,
        unit=unit,
    )
