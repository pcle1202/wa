from datetime import datetime

from pydantic import BaseModel, Field


class LocationSchema(BaseModel):
    query: str
    name: str
    admin1: str | None = None
    country: str | None = None
    country_code: str | None = None
    latitude: float
    longitude: float
    timezone: str | None = None


class AirQualitySchema(BaseModel):
    aqi_us: float | None = None
    aqi_eu: float | None = None
    pm25: float | None = Field(default=None, alias="pm2_5")
    pm10: float | None = None


class PollenSchema(BaseModel):
    alder: float | None = None
    birch: float | None = None
    grass: float | None = None
    mugwort: float | None = None
    olive: float | None = None
    ragweed: float | None = None


class CurrentConditionsSchema(BaseModel):
    time: datetime
    temperature: float | None = None
    feels_like: float | None = None
    humidity: float | None = None
    precipitation: float | None = None
    rain_probability: float | None = None
    weather_code: int | None = None
    weather_summary: str | None = None
    wind_speed: float | None = None
    wind_gusts: float | None = None
    cloud_cover: float | None = None
    visibility: float | None = None
    uv_index: float | None = None
    is_day: int | None = None
    air_quality: AirQualitySchema
    pollen: PollenSchema


class HourlyConditionsSchema(BaseModel):
    time: datetime
    temperature: float | None = None
    feels_like: float | None = None
    humidity: float | None = None
    precipitation_probability: float | None = None
    precipitation: float | None = None
    rain: float | None = None
    showers: float | None = None
    snowfall: float | None = None
    weather_code: int | None = None
    weather_summary: str | None = None
    wind_speed: float | None = None
    wind_gusts: float | None = None
    cloud_cover: float | None = None
    visibility: float | None = None
    uv_index: float | None = None
    air_quality: AirQualitySchema
    pollen: PollenSchema


class DailyConditionsSchema(BaseModel):
    date: datetime
    temp_max: float | None = None
    temp_min: float | None = None
    precipitation_probability_max: float | None = None
    precipitation_sum: float | None = None
    weather_code: int | None = None
    weather_summary: str | None = None
    sunrise: datetime | None = None
    sunset: datetime | None = None
    uv_index_max: float | None = None


class UnitsSchema(BaseModel):
    temperature: str | None = None
    precipitation: str | None = None
    wind_speed: str | None = None
    humidity: str | None = None
    visibility: str | None = None
    uv_index: str | None = None
    air_quality_index: str | None = None
    particulate_matter: str | None = None
    pollen: str | None = None


class NormalizedWeatherResponse(BaseModel):
    location: LocationSchema
    generated_at: datetime
    unit_system: str
    units: UnitsSchema
    current: CurrentConditionsSchema
    hourly: list[HourlyConditionsSchema]
    daily: list[DailyConditionsSchema]
