export type AirQuality = {
  aqi_us: number | null;
  aqi_eu: number | null;
  pm2_5: number | null;
  pm10: number | null;
};

export type Pollen = {
  alder: number | null;
  birch: number | null;
  grass: number | null;
  mugwort: number | null;
  olive: number | null;
  ragweed: number | null;
};

export type CurrentConditions = {
  time: string;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  precipitation: number | null;
  rain_probability: number | null;
  weather_code: number | null;
  weather_summary: string | null;
  wind_speed: number | null;
  wind_gusts: number | null;
  cloud_cover: number | null;
  visibility: number | null;
  uv_index: number | null;
  is_day: number | null;
  air_quality: AirQuality;
  pollen: Pollen;
};

export type HourlyConditions = {
  time: string;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  precipitation_probability: number | null;
  precipitation: number | null;
  rain: number | null;
  showers: number | null;
  snowfall: number | null;
  weather_code: number | null;
  weather_summary: string | null;
  wind_speed: number | null;
  wind_gusts: number | null;
  cloud_cover: number | null;
  visibility: number | null;
  uv_index: number | null;
  air_quality: AirQuality;
  pollen: Pollen;
};

export type DailyConditions = {
  date: string;
  temp_max: number | null;
  temp_min: number | null;
  precipitation_probability_max: number | null;
  precipitation_sum: number | null;
  weather_code: number | null;
  weather_summary: string | null;
  sunrise: string | null;
  sunset: string | null;
  uv_index_max: number | null;
};

export type WeatherUnits = {
  temperature: string | null;
  precipitation: string | null;
  wind_speed: string | null;
  humidity: string | null;
  visibility: string | null;
  uv_index: string | null;
  air_quality_index: string | null;
  particulate_matter: string | null;
  pollen: string | null;
};

export type WeatherLocation = {
  query: string;
  name: string;
  admin1: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

export type WeatherResponse = {
  location: WeatherLocation;
  generated_at: string;
  unit_system: "metric" | "imperial";
  units: WeatherUnits;
  current: CurrentConditions;
  hourly: HourlyConditions[];
  daily: DailyConditions[];
};

export type UserPreferences = {
  default_city: string;
  unit_system: "metric" | "imperial";
  skin_sensitivity: boolean;
  allergy_sensitivity: boolean;
  pollution_sensitivity: boolean;
  preferred_commute_mode: "mixed" | "walk" | "bike" | "drive" | "transit";
  outfit_formality: "casual" | "smart" | "active";
};

export type ScoreCard = {
  label: string;
  score: number;
  level: string;
  summary: string;
};

export type OutfitRecommendation = {
  score: number;
  summary: string;
  clothing_suggestions: string[];
  umbrella_advice: string;
  shoe_suggestion: string;
  accessories: string[];
};

export type HealthRecommendation = {
  score: number;
  summary: string;
  sunscreen_reminder: string;
  hydration_warning: string;
  dry_skin_warning: string;
  allergy_caution: string;
  outdoor_exercise_guidance: string;
};

export type CommuteWindow = {
  time: string;
  score: number;
  summary: string;
};

export type CommuteRecommendation = {
  risk_score: number;
  summary: string;
  best_departure_time: string | null;
  travel_recommendations: string[];
  departure_windows: CommuteWindow[];
};

export type EventOption = {
  event: string;
  score: number;
  summary: string;
  best_time: string | null;
};

export type EventRecommendation = {
  summary: string;
  best_event: string | null;
  activities: EventOption[];
};

export type RecommendationsResponse = {
  location: WeatherLocation;
  generated_at: string;
  unit_system: "metric" | "imperial";
  preferences: Omit<UserPreferences, "default_city">;
  scores: {
    comfort: ScoreCard;
    outdoor: ScoreCard;
    health: ScoreCard;
    commute: ScoreCard;
  };
  outfit: OutfitRecommendation;
  health: HealthRecommendation;
  commute: CommuteRecommendation;
  events: EventRecommendation;
};
