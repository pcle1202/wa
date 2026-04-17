from datetime import datetime

from schemas.recommendations import EventOptionSchema, EventRecommendationSchema
from schemas.weather import HourlyConditionsSchema, NormalizedWeatherResponse
from services.scoring_service import clamp_score


class EventEngine:
    EVENT_LABELS = [
        "picnic",
        "rooftop dinner",
        "photoshoot",
        "hiking",
        "outdoor walk",
        "patio coffee",
    ]

    def generate(self, weather: NormalizedWeatherResponse) -> EventRecommendationSchema:
        activities: list[EventOptionSchema] = []
        for event_name in self.EVENT_LABELS:
            best_entry, score = self._score_event(weather, event_name)
            activities.append(
                EventOptionSchema(
                    event=event_name,
                    score=score,
                    summary=self._event_summary(event_name, score),
                    best_time=self._format_time(best_entry.time) if best_entry else None,
                )
            )

        ranked = sorted(activities, key=lambda activity: activity.score, reverse=True)
        best_event = ranked[0].event if ranked else None
        summary = (
            f"{ranked[0].event.title()} has the strongest weather fit today."
            if ranked
            else "No event scores are available yet."
        )

        return EventRecommendationSchema(
            summary=summary,
            best_event=best_event,
            activities=ranked,
        )

    def _score_event(
        self, weather: NormalizedWeatherResponse, event_name: str
    ) -> tuple[HourlyConditionsSchema | None, int]:
        best_entry: HourlyConditionsSchema | None = None
        best_score = -1
        for entry in weather.hourly[:24]:
            score = self._score_hour(entry, event_name)
            if score > best_score:
                best_entry = entry
                best_score = score
        return best_entry, clamp_score(best_score if best_score >= 0 else 0)

    def _score_hour(self, entry: HourlyConditionsSchema, event_name: str) -> float:
        score = 100.0
        score -= (entry.precipitation_probability or 0) * 0.55
        score -= max((entry.wind_speed or 0) - 18, 0) * 1.1
        score -= max((entry.humidity or 50) - 75, 0) * 0.4
        score -= max((entry.uv_index or 0) - 7, 0) * 4
        score -= max((entry.cloud_cover or 40) - 85, 0) * 0.4

        target_temp = {
            "picnic": 22,
            "rooftop dinner": 20,
            "photoshoot": 19,
            "hiking": 18,
            "outdoor walk": 18,
            "patio coffee": 17,
        }[event_name]
        score -= abs((entry.temperature or target_temp) - target_temp) * 1.8

        if event_name == "photoshoot":
            score -= abs((entry.cloud_cover or 40) - 45) * 0.5
        if event_name == "hiking":
            score -= max((entry.air_quality.aqi_us or 35) - 70, 0) * 0.5
        if event_name == "rooftop dinner":
            score += 8 if self._is_evening(entry.time) else 0
        if event_name == "patio coffee":
            score += 6 if self._is_morning(entry.time) else 0

        return score

    def _event_summary(self, event_name: str, score: int) -> str:
        if score >= 80:
            return f"{event_name.title()} lines up really well with today's conditions."
        if score >= 60:
            return f"{event_name.title()} should work if you time it well."
        if score >= 40:
            return f"{event_name.title()} is possible, but the weather adds friction."
        return f"{event_name.title()} is one of the weaker outdoor fits today."

    def _is_morning(self, value: datetime | None) -> bool:
        return value is not None and 7 <= value.hour <= 10

    def _is_evening(self, value: datetime | None) -> bool:
        return value is not None and 17 <= value.hour <= 20

    def _format_time(self, value: datetime | None) -> str:
        if value is None:
            return "N/A"
        return value.strftime("%I:%M %p").lstrip("0")
