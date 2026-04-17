from datetime import datetime

from pydantic import BaseModel

from schemas.weather import LocationSchema


class UserPreferencesSchema(BaseModel):
    unit_system: str = "metric"
    skin_sensitivity: bool = False
    allergy_sensitivity: bool = False
    pollution_sensitivity: bool = False
    preferred_commute_mode: str = "mixed"
    outfit_formality: str = "casual"


class ScoreCardSchema(BaseModel):
    label: str
    score: int
    level: str
    summary: str


class OverallScoresSchema(BaseModel):
    comfort: ScoreCardSchema
    outdoor: ScoreCardSchema
    health: ScoreCardSchema
    commute: ScoreCardSchema


class OutfitRecommendationSchema(BaseModel):
    score: int
    summary: str
    clothing_suggestions: list[str]
    umbrella_advice: str
    shoe_suggestion: str
    accessories: list[str]


class HealthRecommendationSchema(BaseModel):
    score: int
    summary: str
    sunscreen_reminder: str
    hydration_warning: str
    dry_skin_warning: str
    allergy_caution: str
    outdoor_exercise_guidance: str


class CommuteWindowSchema(BaseModel):
    time: str
    score: int
    summary: str


class CommuteRecommendationSchema(BaseModel):
    risk_score: int
    summary: str
    best_departure_time: str | None = None
    travel_recommendations: list[str]
    departure_windows: list[CommuteWindowSchema]


class EventOptionSchema(BaseModel):
    event: str
    score: int
    summary: str
    best_time: str | None = None


class EventRecommendationSchema(BaseModel):
    summary: str
    best_event: str | None = None
    activities: list[EventOptionSchema]


class RecommendationsResponseSchema(BaseModel):
    location: LocationSchema
    generated_at: datetime
    unit_system: str
    preferences: UserPreferencesSchema
    scores: OverallScoresSchema
    outfit: OutfitRecommendationSchema
    health: HealthRecommendationSchema
    commute: CommuteRecommendationSchema
    events: EventRecommendationSchema
