from schemas.recommendations import HealthRecommendationSchema
from schemas.weather import NormalizedWeatherResponse
from services.scoring_service import clamp_score


class HealthEngine:
    def generate(
        self,
        weather: NormalizedWeatherResponse,
        skin_sensitivity: bool = False,
        allergy_sensitivity: bool = False,
        pollution_sensitivity: bool = False,
    ) -> HealthRecommendationSchema:
        current = weather.current
        uv = current.uv_index or 0
        aqi = current.air_quality.aqi_us or 0
        pm25 = current.air_quality.pm25 or 0
        humidity = current.humidity or 50
        temp = current.temperature or 20
        pollen = max(
            current.pollen.grass or 0,
            current.pollen.ragweed or 0,
            current.pollen.birch or 0,
            current.pollen.alder or 0,
        )

        sunscreen = (
            "High UV today. Apply broad-spectrum sunscreen and reapply if you stay outside."
            if uv >= 6
            else "UV exposure is moderate. Sunscreen is still a good baseline."
            if uv >= 3
            else "UV stress is relatively light, but sunscreen is still a safe habit."
        )
        if skin_sensitivity and uv >= 3:
            sunscreen = "Sensitive skin day: prioritize sunscreen, shade, and shorter direct-sun stretches."

        hydration = (
            "Heat and sun pressure are both elevated, so keep water close and pace outdoor time."
            if temp >= 28 or uv >= 7
            else "Hydration needs look normal, but longer outdoor plans still need water."
        )

        dry_skin = (
            "Air is dry enough to support extra moisturizer and lip balm."
            if humidity <= 35
            else "Humidity is not especially drying right now."
        )
        if skin_sensitivity and humidity <= 45:
            dry_skin = "Skin may dry out faster than usual today, so moisturize earlier than normal."

        allergy = (
            "Pollen signals are elevated, so allergy meds, sunglasses, or shorter outdoor sessions may help."
            if pollen >= 30
            else "Pollen pressure looks manageable for most people."
        )
        if allergy_sensitivity and pollen >= 15:
            allergy = "Allergy-sensitive day: pollen is high enough to justify a more cautious outdoor plan."

        exercise = (
            "Outdoor exercise is not ideal right now due to air quality or heat load."
            if aqi >= 90 or pm25 >= 35 or temp >= 32
            else "Outdoor exercise is reasonable if you keep intensity moderate."
        )
        if pollution_sensitivity and (aqi >= 65 or pm25 >= 20):
            exercise = "Pollution-sensitive conditions suggest moving intense exercise indoors if possible."

        score = clamp_score(
            100
            - max(uv - 5, 0) * 8
            - max(aqi - 50, 0) * 0.8
            - max(pm25 - 15, 0) * 1.4
            - max(pollen - 25, 0) * 0.6
            - max(35 - humidity, 0) * 0.8
        )

        summary = "Health conditions are manageable overall." if score >= 65 else "A few health and skincare signals need extra attention today."

        return HealthRecommendationSchema(
            score=score,
            summary=summary,
            sunscreen_reminder=sunscreen,
            hydration_warning=hydration,
            dry_skin_warning=dry_skin,
            allergy_caution=allergy,
            outdoor_exercise_guidance=exercise,
        )
