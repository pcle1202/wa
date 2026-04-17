import { RecommendationsResponse, UserPreferences, WeatherResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export async function fetchWeather(
  city: string,
  unitSystem: UserPreferences["unit_system"],
): Promise<WeatherResponse> {
  const query = new URLSearchParams({
    city,
    unit: unitSystem,
    hourly_hours: "24",
    daily_days: "7",
  });

  return requestJson<WeatherResponse>(`${API_BASE_URL}/api/weather?${query.toString()}`);
}

export async function fetchRecommendations(
  city: string,
  preferences: UserPreferences,
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams({
    city,
    unit: preferences.unit_system,
    hourly_hours: "24",
    daily_days: "7",
    skin_sensitivity: String(preferences.skin_sensitivity),
    allergy_sensitivity: String(preferences.allergy_sensitivity),
    pollution_sensitivity: String(preferences.pollution_sensitivity),
    preferred_commute_mode: preferences.preferred_commute_mode,
    outfit_formality: preferences.outfit_formality,
  });

  return requestJson<RecommendationsResponse>(`${API_BASE_URL}/api/recommendations?${query.toString()}`);
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const detail = await safeReadError(response);
    throw new Error(detail || "Unable to load data.");
  }
  return (await response.json()) as T;
}

async function safeReadError(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail || null;
  } catch {
    return null;
  }
}
