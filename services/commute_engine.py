from datetime import datetime

from schemas.recommendations import CommuteRecommendationSchema, CommuteWindowSchema
from schemas.weather import HourlyConditionsSchema, NormalizedWeatherResponse
from services.scoring_service import clamp_score


class CommuteEngine:
    def generate(self, weather: NormalizedWeatherResponse, preferred_mode: str = "mixed") -> CommuteRecommendationSchema:
        windows: list[CommuteWindowSchema] = []
        for entry in weather.hourly[:12]:
            windows.append(
                CommuteWindowSchema(
                    time=self._format_time(entry.time),
                    score=self._window_score(entry, preferred_mode),
                    summary=self._window_summary(entry),
                )
            )

        ranked_windows = sorted(windows, key=lambda window: window.score, reverse=True)
        best_window = ranked_windows[0] if ranked_windows else None
        current_risk = 100 - (best_window.score if best_window else 50)

        recommendations = self._travel_recommendations(weather, preferred_mode)
        summary = (
            f"The calmest departure window looks like {best_window.time}."
            if best_window
            else "The commute data is available, but no strong departure window stood out."
        )

        return CommuteRecommendationSchema(
            risk_score=clamp_score(current_risk),
            summary=summary,
            best_departure_time=best_window.time if best_window else None,
            travel_recommendations=recommendations,
            departure_windows=ranked_windows[:3],
        )

    def _window_score(self, entry: HourlyConditionsSchema, preferred_mode: str) -> int:
        score = 100.0
        score -= (entry.precipitation_probability or 0) * 0.45
        score -= max((entry.wind_speed or 0) - 20, 0) * 1.4
        score -= max((entry.air_quality.aqi_us or 40) - 70, 0) * 0.6
        score -= max(2000 - (entry.visibility or 10000), 0) / 120
        score -= abs((entry.temperature or 20) - 20) * 1.3

        if preferred_mode == "bike":
            score -= max((entry.wind_speed or 0) - 15, 0) * 1.2
            score -= (entry.precipitation_probability or 0) * 0.25
        elif preferred_mode == "walk":
            score -= abs((entry.temperature or 20) - 18) * 0.8
        elif preferred_mode == "drive":
            score -= max(3000 - (entry.visibility or 10000), 0) / 150

        return clamp_score(score)

    def _window_summary(self, entry: HourlyConditionsSchema) -> str:
        signals: list[str] = []
        if (entry.precipitation_probability or 0) >= 35:
            signals.append("showers may interfere")
        if (entry.air_quality.aqi_us or 0) >= 80:
            signals.append("air quality is degraded")
        if (entry.wind_speed or 0) >= 25:
            signals.append("winds are noticeably strong")
        if not signals:
            signals.append("conditions are relatively steady")

        return ", ".join(signals)

    def _travel_recommendations(self, weather: NormalizedWeatherResponse, preferred_mode: str) -> list[str]:
        current = weather.current
        recommendations = [
            "Keep an eye on rain timing before leaving.",
            "Use the top-ranked departure window if your schedule is flexible.",
        ]
        if (current.air_quality.aqi_us or 0) >= 85:
            recommendations.append("Shorten long outdoor segments because air quality is slipping.")
        if preferred_mode in {"walk", "bike"} and (current.rain_probability or 0) >= 40:
            recommendations.append("Have a backup transit or rideshare option ready.")
        if (current.visibility or 10000) <= 3000:
            recommendations.append("Visibility is reduced enough to justify extra travel buffer.")
        return recommendations

    def _format_time(self, value: datetime | None) -> str:
        if value is None:
            return "N/A"
        return value.strftime("%I:%M %p").lstrip("0")
