import { UserPreferences } from "@/lib/types";

export const DEFAULT_PREFERENCES: UserPreferences = {
  default_city: "Boston",
  unit_system: "metric",
  skin_sensitivity: false,
  allergy_sensitivity: false,
  pollution_sensitivity: false,
  preferred_commute_mode: "mixed",
  outfit_formality: "casual",
};

export const PREFERENCES_STORAGE_KEY = "weather-life-assistant-preferences";

export function loadStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    return {
      ...DEFAULT_PREFERENCES,
      ...(JSON.parse(raw) as Partial<UserPreferences>),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function persistPreferences(preferences: UserPreferences) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
