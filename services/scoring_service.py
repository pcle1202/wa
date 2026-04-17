from schemas.recommendations import OverallScoresSchema, ScoreCardSchema
from schemas.weather import NormalizedWeatherResponse


def clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))


def level_for_score(score: int) -> str:
    if score >= 80:
        return "great"
    if score >= 60:
        return "good"
    if score >= 40:
        return "mixed"
    return "tough"


class ScoringService:
    def score_overview(self, weather: NormalizedWeatherResponse) -> OverallScoresSchema:
        current = weather.current
        comfort = clamp_score(
            100
            - abs((current.feels_like or current.temperature or 20) - 22) * 3
            - max((current.humidity or 50) - 70, 0) * 0.6
            - max((current.wind_speed or 0) - 18, 0) * 1.2
        )
        outdoor = clamp_score(
            100
            - (current.rain_probability or 0) * 0.5
            - max((current.uv_index or 0) - 7, 0) * 6
            - max((current.wind_speed or 0) - 20, 0) * 1.5
            - max((current.air_quality.aqi_us or 40) - 70, 0) * 0.7
        )
        health = clamp_score(
            100
            - max((current.uv_index or 0) - 5, 0) * 7
            - max((current.air_quality.aqi_us or 35) - 50, 0) * 0.8
            - max((current.pollen.grass or 0) - 30, 0) * 0.5
            - max((current.humidity or 50) - 80, 0) * 0.6
        )
        commute = clamp_score(
            100
            - (current.rain_probability or 0) * 0.45
            - max((current.wind_speed or 0) - 20, 0) * 1.6
            - max((current.air_quality.aqi_us or 40) - 70, 0) * 0.6
            - max(2 - ((current.visibility or 10000) / 5000), 0) * 20
        )

        return OverallScoresSchema(
            comfort=self._score_card("Comfort", comfort, "How physically comfortable it feels outside right now."),
            outdoor=self._score_card("Outdoor", outdoor, "How friendly the current conditions are for time outside."),
            health=self._score_card("Health", health, "How much the current weather and air quality press on wellbeing."),
            commute=self._score_card("Commute", commute, "How manageable current travel conditions look overall."),
        )

    def _score_card(self, label: str, score: int, base_summary: str) -> ScoreCardSchema:
        level = level_for_score(score)
        if level == "great":
            summary = f"{base_summary} Conditions are favorable."
        elif level == "good":
            summary = f"{base_summary} Most signals are manageable."
        elif level == "mixed":
            summary = f"{base_summary} A few weather signals need attention."
        else:
            summary = f"{base_summary} Conditions are actively working against comfort."

        return ScoreCardSchema(label=label, score=score, level=level, summary=summary)
