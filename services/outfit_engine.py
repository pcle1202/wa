from schemas.recommendations import OutfitRecommendationSchema
from schemas.weather import NormalizedWeatherResponse
from services.scoring_service import clamp_score


class OutfitEngine:
    def generate(self, weather: NormalizedWeatherResponse, outfit_formality: str = "casual") -> OutfitRecommendationSchema:
        current = weather.current
        temp = current.feels_like if current.feels_like is not None else current.temperature or 20
        humidity = current.humidity or 50
        wind = current.wind_speed or 0
        rain_probability = current.rain_probability or 0

        clothing: list[str] = []
        accessories: list[str] = []

        if temp <= 2:
            clothing.extend(["heavy coat", "thermal base layer", "warm pants"])
            accessories.extend(["gloves", "scarf"])
        elif temp <= 10:
            clothing.extend(["medium coat", "long sleeves", "full-length pants"])
        elif temp <= 18:
            clothing.extend(["light jacket", "layerable top", "comfortable pants"])
        elif temp <= 26:
            clothing.extend(["t-shirt or breathable top", "light bottoms"])
        else:
            clothing.extend(["airy top", "breathable shorts or loose pants"])
            accessories.append("hat")

        if humidity >= 75:
            clothing.append("moisture-wicking fabrics")
        if wind >= 20:
            clothing.append("wind-resistant outer layer")
        if outfit_formality == "smart":
            clothing.append("polished outer layer or refined shoes")

        umbrella_advice = (
            "Carry an umbrella."
            if rain_probability >= 50
            else "Keep a compact umbrella nearby."
            if rain_probability >= 25
            else "No umbrella needed."
        )

        if rain_probability >= 45:
            shoe_suggestion = "Water-resistant shoes or boots"
        elif temp >= 24:
            shoe_suggestion = "Breathable sneakers"
        else:
            shoe_suggestion = "Comfortable everyday shoes"

        if current.uv_index and current.uv_index >= 6:
            accessories.append("sunglasses")

        score = clamp_score(
            100
            - abs(temp - 21) * 2.5
            - max(humidity - 75, 0) * 0.5
            - max(wind - 22, 0) * 1.2
            - rain_probability * 0.35
        )

        summary = (
            f"{weather.location.name} feels like a {self._temperature_feel(temp)} day, "
            f"so {clothing[0]} and {shoe_suggestion.lower()} make the most sense."
        )

        return OutfitRecommendationSchema(
            score=score,
            summary=summary,
            clothing_suggestions=clothing,
            umbrella_advice=umbrella_advice,
            shoe_suggestion=shoe_suggestion,
            accessories=accessories,
        )

    def _temperature_feel(self, temp: float) -> str:
        if temp <= 5:
            return "cold"
        if temp <= 14:
            return "cool"
        if temp <= 24:
            return "mild"
        return "warm"
