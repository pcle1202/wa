from datetime import UTC, datetime

import httpx
from fastapi import HTTPException

from schemas.weather import (
    AirQualitySchema,
    CurrentConditionsSchema,
    DailyConditionsSchema,
    HourlyConditionsSchema,
    LocationSchema,
    NormalizedWeatherResponse,
    PollenSchema,
    UnitsSchema,
)
from services.geocoding_service import GeocodedLocation
from services.weather_codes import describe_weather_code


FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


class WeatherService:
    CURRENT_FIELDS = [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
        "wind_gusts_10m",
        "cloud_cover",
        "visibility",
        "is_day",
    ]
    HOURLY_FIELDS = [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation_probability",
        "precipitation",
        "rain",
        "showers",
        "snowfall",
        "weather_code",
        "wind_speed_10m",
        "wind_gusts_10m",
        "cloud_cover",
        "visibility",
    ]
    DAILY_FIELDS = [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "precipitation_sum",
        "weather_code",
        "sunrise",
        "sunset",
    ]

    async def fetch_weather(
        self,
        latitude: float,
        longitude: float,
        timezone: str,
        unit: str,
        hourly_hours: int,
        daily_days: int,
    ) -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": timezone,
            "temperature_unit": "fahrenheit" if unit == "imperial" else "celsius",
            "wind_speed_unit": "mph" if unit == "imperial" else "kmh",
            "precipitation_unit": "inch" if unit == "imperial" else "mm",
            "current": ",".join(self.CURRENT_FIELDS),
            "hourly": ",".join(self.HOURLY_FIELDS),
            "daily": ",".join(self.DAILY_FIELDS),
            "forecast_hours": hourly_hours,
            "forecast_days": daily_days,
        }

        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.get(FORECAST_URL, params=params)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail="Weather provider request failed.") from exc

        data = response.json()
        if "current" not in data or "hourly" not in data or "daily" not in data:
            raise HTTPException(status_code=502, detail="Weather provider returned an incomplete payload.")

        return data

    def normalize_response(
        self,
        location: GeocodedLocation,
        weather_data: dict,
        air_quality_data: dict,
        hourly_hours: int,
        daily_days: int,
        unit: str,
    ) -> NormalizedWeatherResponse:
        hourly_weather = weather_data.get("hourly") or {}
        daily_weather = weather_data.get("daily") or {}
        current_weather = weather_data.get("current") or {}
        current_air = air_quality_data.get("current") or {}
        hourly_air = air_quality_data.get("hourly") or {}

        current = CurrentConditionsSchema(
            time=self._parse_datetime(current_weather.get("time")),
            temperature=current_weather.get("temperature_2m"),
            feels_like=current_weather.get("apparent_temperature"),
            humidity=current_weather.get("relative_humidity_2m"),
            precipitation=current_weather.get("precipitation"),
            rain_probability=self._first_value(hourly_weather.get("precipitation_probability")),
            weather_code=current_weather.get("weather_code"),
            weather_summary=describe_weather_code(current_weather.get("weather_code")),
            wind_speed=current_weather.get("wind_speed_10m"),
            wind_gusts=current_weather.get("wind_gusts_10m"),
            cloud_cover=current_weather.get("cloud_cover"),
            visibility=current_weather.get("visibility"),
            uv_index=current_air.get("uv_index"),
            is_day=current_weather.get("is_day"),
            air_quality=self._build_air_quality(current_air),
            pollen=self._build_pollen(current_air),
        )

        hourly = []
        hourly_times = (hourly_weather.get("time") or [])[:hourly_hours]
        for index, timestamp in enumerate(hourly_times):
            row = HourlyConditionsSchema(
                time=self._parse_datetime(timestamp),
                temperature=self._value_at(hourly_weather, "temperature_2m", index),
                feels_like=self._value_at(hourly_weather, "apparent_temperature", index),
                humidity=self._value_at(hourly_weather, "relative_humidity_2m", index),
                precipitation_probability=self._value_at(hourly_weather, "precipitation_probability", index),
                precipitation=self._value_at(hourly_weather, "precipitation", index),
                rain=self._value_at(hourly_weather, "rain", index),
                showers=self._value_at(hourly_weather, "showers", index),
                snowfall=self._value_at(hourly_weather, "snowfall", index),
                weather_code=self._value_at(hourly_weather, "weather_code", index),
                weather_summary=describe_weather_code(self._value_at(hourly_weather, "weather_code", index)),
                wind_speed=self._value_at(hourly_weather, "wind_speed_10m", index),
                wind_gusts=self._value_at(hourly_weather, "wind_gusts_10m", index),
                cloud_cover=self._value_at(hourly_weather, "cloud_cover", index),
                visibility=self._value_at(hourly_weather, "visibility", index),
                uv_index=self._value_at(hourly_air, "uv_index", index),
                air_quality=self._build_air_quality_from_hourly(hourly_air, index),
                pollen=self._build_pollen_from_hourly(hourly_air, index),
            )
            hourly.append(row)

        daily = []
        daily_times = (daily_weather.get("time") or [])[:daily_days]
        for index, timestamp in enumerate(daily_times):
            daily.append(
                DailyConditionsSchema(
                    date=self._parse_datetime(timestamp),
                    temp_max=self._value_at(daily_weather, "temperature_2m_max", index),
                    temp_min=self._value_at(daily_weather, "temperature_2m_min", index),
                    precipitation_probability_max=self._value_at(
                        daily_weather, "precipitation_probability_max", index
                    ),
                    precipitation_sum=self._value_at(daily_weather, "precipitation_sum", index),
                    weather_code=self._value_at(daily_weather, "weather_code", index),
                    weather_summary=describe_weather_code(self._value_at(daily_weather, "weather_code", index)),
                    sunrise=self._parse_datetime(self._value_at(daily_weather, "sunrise", index)),
                    sunset=self._parse_datetime(self._value_at(daily_weather, "sunset", index)),
                    uv_index_max=self._daily_uv_max(hourly, index),
                )
            )

        return NormalizedWeatherResponse(
            location=LocationSchema(
                query=location.query,
                name=location.name,
                admin1=location.admin1,
                country=location.country,
                country_code=location.country_code,
                latitude=location.latitude,
                longitude=location.longitude,
                timezone=location.timezone,
            ),
            generated_at=datetime.now(UTC),
            unit_system=unit,
            units=self._build_units(weather_data, air_quality_data),
            current=current,
            hourly=hourly,
            daily=daily,
        )

    def _build_units(self, weather_data: dict, air_quality_data: dict) -> UnitsSchema:
        current_units = weather_data.get("current_units") or {}
        return UnitsSchema(
            temperature=current_units.get("temperature_2m"),
            precipitation=current_units.get("precipitation"),
            wind_speed=current_units.get("wind_speed_10m"),
            humidity=current_units.get("relative_humidity_2m"),
            visibility=current_units.get("visibility"),
            uv_index=(air_quality_data.get("current_units") or {}).get("uv_index"),
            air_quality_index="AQI",
            particulate_matter="ug/m3",
            pollen=(air_quality_data.get("current_units") or {}).get("alder_pollen"),
        )

    def _build_air_quality(self, payload: dict) -> AirQualitySchema:
        return AirQualitySchema(
            aqi_us=payload.get("us_aqi"),
            aqi_eu=payload.get("european_aqi"),
            pm2_5=payload.get("pm2_5"),
            pm10=payload.get("pm10"),
        )

    def _build_air_quality_from_hourly(self, payload: dict, index: int) -> AirQualitySchema:
        return AirQualitySchema(
            aqi_us=self._value_at(payload, "us_aqi", index),
            aqi_eu=self._value_at(payload, "european_aqi", index),
            pm2_5=self._value_at(payload, "pm2_5", index),
            pm10=self._value_at(payload, "pm10", index),
        )

    def _build_pollen(self, payload: dict) -> PollenSchema:
        return PollenSchema(
            alder=payload.get("alder_pollen"),
            birch=payload.get("birch_pollen"),
            grass=payload.get("grass_pollen"),
            mugwort=payload.get("mugwort_pollen"),
            olive=payload.get("olive_pollen"),
            ragweed=payload.get("ragweed_pollen"),
        )

    def _build_pollen_from_hourly(self, payload: dict, index: int) -> PollenSchema:
        return PollenSchema(
            alder=self._value_at(payload, "alder_pollen", index),
            birch=self._value_at(payload, "birch_pollen", index),
            grass=self._value_at(payload, "grass_pollen", index),
            mugwort=self._value_at(payload, "mugwort_pollen", index),
            olive=self._value_at(payload, "olive_pollen", index),
            ragweed=self._value_at(payload, "ragweed_pollen", index),
        )

    def _daily_uv_max(self, hourly: list[HourlyConditionsSchema], day_index: int) -> float | None:
        if day_index >= len(hourly) // 24 + 1:
            return None

        start = day_index * 24
        end = start + 24
        values = [entry.uv_index for entry in hourly[start:end] if entry.uv_index is not None]
        return max(values) if values else None

    def _first_value(self, values: list | None) -> float | None:
        if not values:
            return None
        return values[0]

    def _value_at(self, payload: dict, key: str, index: int):
        values = payload.get(key) or []
        if index >= len(values):
            return None
        return values[index]

    def _parse_datetime(self, value: str | None) -> datetime | None:
        if value is None:
            return None
        return datetime.fromisoformat(value)
