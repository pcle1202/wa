"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, startTransition, useEffect, useEffectEvent, useState } from "react";

import { HourlyChart } from "@/components/hourly-chart";
import { fetchRecommendations, fetchWeather } from "@/lib/api";
import {
  RecommendationsResponse,
  ScoreCard,
  UserPreferences,
  WeatherResponse,
} from "@/lib/types";
import {
  DEFAULT_PREFERENCES,
  loadStoredPreferences,
  persistPreferences,
} from "@/lib/preferences";

type AppView = "home" | "outfit" | "health" | "commute" | "events";

type AssistantAppProps = {
  view: AppView;
};

const NAV_ITEMS: Array<{ href: string; label: string; view: AppView }> = [
  { href: "/", label: "Dashboard", view: "home" },
  { href: "/outfit", label: "Outfit", view: "outfit" },
  { href: "/health", label: "Health", view: "health" },
  { href: "/commute", label: "Commute", view: "commute" },
  { href: "/events", label: "Events", view: "events" },
];

export function AssistantApp({ view }: AssistantAppProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [query, setQuery] = useState(DEFAULT_PREFERENCES.default_city);
  const [activeCity, setActiveCity] = useState(DEFAULT_PREFERENCES.default_city);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const loadAllData = useEffectEvent(async (city: string, nextPreferences: UserPreferences) => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextWeather, nextRecommendations] = await Promise.all([
        fetchWeather(city, nextPreferences.unit_system),
        fetchRecommendations(city, nextPreferences),
      ]);
      setWeather(nextWeather);
      setRecommendations(nextRecommendations);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load assistant data.");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    const stored = loadStoredPreferences();
    setPreferences(stored);
    setQuery(stored.default_city);
    setActiveCity(stored.default_city);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    persistPreferences(preferences);
    void loadAllData(activeCity, preferences);
  }, [activeCity, isReady, preferences, loadAllData]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCity = query.trim();
    if (!nextCity) {
      return;
    }
    startTransition(() => {
      setActiveCity(nextCity);
      setPreferences((current) => ({ ...current, default_city: nextCity }));
    });
  }

  function updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    startTransition(() => {
      setPreferences((current) => ({
        ...current,
        [key]: value,
      }));
    });
  }

  const chartData = (weather?.hourly || []).slice(0, 24).map((entry) => ({
    label: formatHour(entry.time),
    temperature: Math.round(entry.temperature ?? 0),
    rainChance: Math.round(entry.precipitation_probability ?? 0),
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="glass-card rounded-[34px] p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm uppercase tracking-[0.32em] text-ink/55">Weather Based Life Assistant</p>
            <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Weather, air quality, and daily decisions brought into one rules-based dashboard.
            </h1>
            <p className="text-base leading-7 text-ink/72 sm:text-lg">
              The app now spans the full stack: normalized weather data, scorecards, recommendation
              engines, dedicated module pages, and local preferences that shape the advice you see.
            </p>
          </div>
          <div className="rounded-[28px] bg-ink p-5 text-white shadow-card xl:w-[26rem]">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">Current Review Target</p>
            <h2 className="mt-3 text-3xl font-semibold">{activeCity}</h2>
            <p className="mt-2 text-white/72">
              {weather?.current.weather_summary || "Waiting for fresh conditions"}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <SnapshotBadge
                label="Temperature"
                value={weather ? formatMetric(weather.current.temperature, weather.units.temperature) : "Loading"}
              />
              <SnapshotBadge
                label="Feels Like"
                value={weather ? formatMetric(weather.current.feels_like, weather.units.temperature) : "Loading"}
              />
              <SnapshotBadge
                label="AQI"
                value={
                  weather
                    ? formatMetric(weather.current.air_quality.aqi_us, weather.units.air_quality_index)
                    : "Loading"
                }
              />
              <SnapshotBadge
                label="UV"
                value={weather ? formatMetric(weather.current.uv_index, weather.units.uv_index) : "Loading"}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-ink/8 bg-white/70 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = item.view === view;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      isActive ? "bg-ink text-white" : "bg-ink/5 text-ink/72 hover:bg-ink/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <form onSubmit={handleSearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a city"
                className="h-14 flex-1 rounded-2xl border border-ink/10 bg-white px-5 text-base text-ink outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/20"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-14 rounded-2xl bg-sky px-6 text-base font-medium text-ink transition hover:bg-sky/85 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Refreshing..." : "Update City"}
              </button>
            </form>
          </div>

          <PreferencesPanel preferences={preferences} onChange={updatePreference} />
        </div>
      </header>

      {error ? (
        <section className="glass-card rounded-[28px] p-6 text-ink shadow-card">
          <p className="text-lg font-semibold">The assistant couldn&apos;t load data for this city.</p>
          <p className="mt-2 text-ink/72">
            Check that FastAPI is running on `http://127.0.0.1:8000` and that the city name resolves through Open-Meteo.
          </p>
          <p className="mt-3 rounded-2xl bg-coral/10 px-4 py-3 text-sm text-ink/80">{error}</p>
        </section>
      ) : null}

      {recommendations ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScorePanel score={recommendations.scores.comfort} />
          <ScorePanel score={recommendations.scores.outdoor} />
          <ScorePanel score={recommendations.scores.health} />
          <ScorePanel score={recommendations.scores.commute} />
        </section>
      ) : null}

      {weather && view === "home" ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Humidity" value={formatMetric(weather.current.humidity, weather.units.humidity)} note={humidityNote(weather.current.humidity)} />
            <MetricCard label="Wind" value={formatMetric(weather.current.wind_speed, weather.units.wind_speed)} note={windNote(weather.current.wind_speed)} />
            <MetricCard label="UV" value={formatMetric(weather.current.uv_index, weather.units.uv_index)} note={uvNote(weather.current.uv_index)} />
            <MetricCard label="AQI" value={formatMetric(weather.current.air_quality.aqi_us, weather.units.air_quality_index)} note={aqiNote(weather.current.air_quality.aqi_us)} />
            <MetricCard label="Rain Chance" value={`${Math.round(weather.current.rain_probability ?? 0)}%`} note={rainNote(weather.current.rain_probability)} />
          </section>

          <HourlyChart data={chartData} temperatureUnit={weather.units.temperature || ""} />

          {recommendations ? (
            <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <ModuleCard href="/outfit" title="Outfit Planner" summary={recommendations.outfit.summary} score={recommendations.outfit.score} accent="from-sky/80 to-white" />
              <ModuleCard href="/health" title="Health and Skincare" summary={recommendations.health.summary} score={recommendations.health.score} accent="from-sun/80 to-white" />
              <ModuleCard href="/commute" title="Commute Optimizer" summary={recommendations.commute.summary} score={100 - recommendations.commute.risk_score} accent="from-pine/70 to-mist" />
              <ModuleCard href="/events" title="Event Planner" summary={recommendations.events.summary} score={recommendations.events.activities[0]?.score || 0} accent="from-coral/75 to-white" />
            </section>
          ) : null}

          <section className="glass-card rounded-[30px] p-6 shadow-card sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-ink/50">7-Day Outlook</p>
                <h2 className="text-2xl font-semibold text-ink">Upcoming daily weather view</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/65">
                This daily section feeds the module engines with temperature swings, rain risk, and sunset-aware planning signals.
              </p>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {weather.daily.map((day) => (
                <article key={day.date} className="rounded-3xl border border-ink/8 bg-white/70 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-ink/45">{formatDay(day.date)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{day.weather_summary}</h3>
                      <p className="mt-1 text-sm text-ink/65">Sunset {formatTime(day.sunset)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-ink">
                        {Math.round(day.temp_max ?? 0)}
                        {weather.units.temperature}
                      </p>
                      <p className="text-sm text-ink/60">
                        Low {Math.round(day.temp_min ?? 0)}
                        {weather.units.temperature}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-ink/70">
                    Rain {Math.round(day.precipitation_probability_max ?? 0)}% - UV max {Math.round(day.uv_index_max ?? 0)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {weather && recommendations && view === "outfit" ? <OutfitView weather={weather} recommendations={recommendations} /> : null}
      {weather && recommendations && view === "health" ? <HealthView weather={weather} recommendations={recommendations} /> : null}
      {weather && recommendations && view === "commute" ? <CommuteView weather={weather} recommendations={recommendations} /> : null}
      {weather && recommendations && view === "events" ? <EventsView weather={weather} recommendations={recommendations} /> : null}

      {isLoading && !weather ? (
        <section className="glass-card rounded-[30px] p-8 text-ink shadow-card">
          <div className="h-10 w-48 animate-pulse rounded-full bg-ink/10" />
          <div className="mt-4 h-40 animate-pulse rounded-[28px] bg-ink/8" />
        </section>
      ) : null}
    </main>
  );
}

function PreferencesPanel({
  preferences,
  onChange,
}: {
  preferences: UserPreferences;
  onChange: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  return (
    <aside className="rounded-[28px] border border-ink/8 bg-white/72 p-5">
      <p className="text-sm uppercase tracking-[0.24em] text-ink/50">Local Preferences</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PreferenceField label="Units">
          <select
            value={preferences.unit_system}
            onChange={(event) => onChange("unit_system", event.target.value as UserPreferences["unit_system"])}
            className="h-11 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink"
          >
            <option value="metric">Metric</option>
            <option value="imperial">Imperial</option>
          </select>
        </PreferenceField>
        <PreferenceField label="Commute Mode">
          <select
            value={preferences.preferred_commute_mode}
            onChange={(event) =>
              onChange("preferred_commute_mode", event.target.value as UserPreferences["preferred_commute_mode"])
            }
            className="h-11 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink"
          >
            <option value="mixed">Mixed</option>
            <option value="walk">Walk</option>
            <option value="bike">Bike</option>
            <option value="drive">Drive</option>
            <option value="transit">Transit</option>
          </select>
        </PreferenceField>
        <PreferenceField label="Outfit Style">
          <select
            value={preferences.outfit_formality}
            onChange={(event) =>
              onChange("outfit_formality", event.target.value as UserPreferences["outfit_formality"])
            }
            className="h-11 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink"
          >
            <option value="casual">Casual</option>
            <option value="smart">Smart</option>
            <option value="active">Active</option>
          </select>
        </PreferenceField>
        <div className="grid gap-2 text-sm text-ink/75">
          <Toggle
            label="Sensitive skin"
            checked={preferences.skin_sensitivity}
            onChange={(checked) => onChange("skin_sensitivity", checked)}
          />
          <Toggle
            label="Allergy sensitive"
            checked={preferences.allergy_sensitivity}
            onChange={(checked) => onChange("allergy_sensitivity", checked)}
          />
          <Toggle
            label="Pollution sensitive"
            checked={preferences.pollution_sensitivity}
            onChange={(checked) => onChange("pollution_sensitivity", checked)}
          />
        </div>
      </div>
    </aside>
  );
}

function OutfitView({
  weather,
  recommendations,
}: {
  weather: WeatherResponse;
  recommendations: RecommendationsResponse;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Outfit Planner" title="Detailed clothing guidance" />
        <p className="mt-4 text-lg text-ink/78">{recommendations.outfit.summary}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailStat label="Outfit Score" value={`${recommendations.outfit.score}/100`} />
          <DetailStat label="Umbrella" value={recommendations.outfit.umbrella_advice} />
          <DetailStat label="Shoes" value={recommendations.outfit.shoe_suggestion} />
          <DetailStat label="Feels Like" value={formatMetric(weather.current.feels_like, weather.units.temperature)} />
        </div>
      </article>
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Pieces" title="What to wear" />
        <ListBlock title="Clothing Suggestions" items={recommendations.outfit.clothing_suggestions} />
        <ListBlock title="Accessories" items={recommendations.outfit.accessories.length ? recommendations.outfit.accessories : ["No extra accessories needed right now."]} />
      </article>
    </section>
  );
}

function HealthView({
  weather,
  recommendations,
}: {
  weather: WeatherResponse;
  recommendations: RecommendationsResponse;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Health and Skincare" title="Weather-driven wellness guidance" />
        <p className="mt-4 text-lg text-ink/78">{recommendations.health.summary}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailStat label="Health Score" value={`${recommendations.health.score}/100`} />
          <DetailStat label="UV" value={formatMetric(weather.current.uv_index, weather.units.uv_index)} />
          <DetailStat label="AQI" value={formatMetric(weather.current.air_quality.aqi_us, weather.units.air_quality_index)} />
          <DetailStat label="PM2.5" value={formatMetric(weather.current.air_quality.pm2_5, weather.units.particulate_matter)} />
        </div>
      </article>
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Recommendations" title="Care checklist" />
        <ListBlock
          title="Today"
          items={[
            recommendations.health.sunscreen_reminder,
            recommendations.health.hydration_warning,
            recommendations.health.dry_skin_warning,
            recommendations.health.allergy_caution,
            recommendations.health.outdoor_exercise_guidance,
          ]}
        />
      </article>
    </section>
  );
}

function CommuteView({
  weather,
  recommendations,
}: {
  weather: WeatherResponse;
  recommendations: RecommendationsResponse;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Commute Optimizer" title="Departure timing and travel risk" />
        <p className="mt-4 text-lg text-ink/78">{recommendations.commute.summary}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailStat label="Risk Score" value={`${recommendations.commute.risk_score}/100`} />
          <DetailStat label="Best Departure" value={recommendations.commute.best_departure_time || "N/A"} />
          <DetailStat label="Wind" value={formatMetric(weather.current.wind_speed, weather.units.wind_speed)} />
          <DetailStat label="Visibility" value={formatMetric(weather.current.visibility, weather.units.visibility)} />
        </div>
        <ListBlock title="Travel Recommendations" items={recommendations.commute.travel_recommendations} />
      </article>
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Best Windows" title="Top departure options" />
        <div className="mt-5 grid gap-3">
          {recommendations.commute.departure_windows.map((window) => (
            <div key={window.time} className="rounded-3xl border border-ink/8 bg-white/72 p-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-ink">{window.time}</h3>
                <span className="rounded-full bg-ink px-3 py-1 text-sm text-white">{window.score}/100</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/72">{window.summary}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function EventsView({
  weather,
  recommendations,
}: {
  weather: WeatherResponse;
  recommendations: RecommendationsResponse;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Event Planner" title="Outdoor activity ranking" />
        <p className="mt-4 text-lg text-ink/78">{recommendations.events.summary}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailStat label="Best Event" value={recommendations.events.best_event || "N/A"} />
          <DetailStat label="Sunset" value={formatTime(weather.daily[0]?.sunset || null)} />
          <DetailStat label="Cloud Cover" value={`${Math.round(weather.current.cloud_cover ?? 0)}%`} />
          <DetailStat label="Rain Chance" value={`${Math.round(weather.current.rain_probability ?? 0)}%`} />
        </div>
      </article>
      <article className="glass-card rounded-[30px] p-6 shadow-card">
        <SectionHeader eyebrow="Activity Scores" title="What fits best today" />
        <div className="mt-5 grid gap-3">
          {recommendations.events.activities.map((activity) => (
            <div key={activity.event} className="rounded-3xl border border-ink/8 bg-white/72 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold capitalize text-ink">{activity.event}</h3>
                  <p className="mt-1 text-sm text-ink/65">Best time {activity.best_time || "N/A"}</p>
                </div>
                <span className="rounded-full bg-coral px-3 py-1 text-sm text-white">{activity.score}/100</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/72">{activity.summary}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function ModuleCard({
  href,
  title,
  summary,
  score,
  accent,
}: {
  href: string;
  title: string;
  summary: string;
  score: number;
  accent: string;
}) {
  return (
    <Link href={href} className={`rounded-[28px] bg-gradient-to-br ${accent} p-[1px] shadow-card`}>
      <article className="h-full rounded-[27px] bg-[rgba(255,255,255,0.92)] p-5 transition hover:bg-white">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm uppercase tracking-[0.22em] text-ink/50">Module</p>
          <span className="rounded-full bg-ink px-3 py-1 text-sm text-white">{score}/100</span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-ink">{title}</h3>
        <p className="mt-4 text-sm leading-6 text-ink/72">{summary}</p>
        <p className="mt-5 text-sm font-medium text-ink">Open details</p>
      </article>
    </Link>
  );
}

function ScorePanel({ score }: { score: ScoreCard }) {
  return (
    <article className="glass-card rounded-[26px] p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.22em] text-ink/55">{score.label}</p>
        <span className={`rounded-full px-3 py-1 text-sm ${scoreTone(score.level)}`}>{score.level}</span>
      </div>
      <div className="mt-4 text-4xl font-semibold text-ink">{score.score}</div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{score.summary}</p>
    </article>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="glass-card rounded-[26px] p-5 shadow-card">
      <p className="text-sm uppercase tracking-[0.22em] text-ink/52">{label}</p>
      <div className="mt-4 text-3xl font-semibold text-ink">{value}</div>
      <p className="mt-3 text-sm leading-6 text-ink/68">{note}</p>
    </article>
  );
}

function SnapshotBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/55">{label}</p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-sm uppercase tracking-[0.22em] text-ink/50">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold text-ink">{title}</h2>
    </>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-3xl border border-ink/8 bg-white/72 px-4 py-3 text-sm leading-6 text-ink/74">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-ink/8 bg-white/72 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/48">{label}</p>
      <p className="mt-2 text-lg font-medium text-ink">{value}</p>
    </div>
  );
}

function PreferenceField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm text-ink/72">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-white px-3 py-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function scoreTone(level: string) {
  if (level === "great") return "bg-pine text-white";
  if (level === "good") return "bg-sky text-ink";
  if (level === "mixed") return "bg-sun text-ink";
  return "bg-coral text-white";
}

function formatMetric(value: number | null, unit: string | null) {
  if (value === null || Number.isNaN(value)) return "N/A";
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return unit ? `${rounded} ${unit}` : rounded;
}

function formatHour(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric" });
}

function formatTime(value: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function humidityNote(value: number | null) {
  if (value === null) return "Humidity data is unavailable.";
  if (value >= 75) return "Air feels sticky enough to affect comfort and outfit choices.";
  if (value <= 35) return "Dry air may matter for skin and hydration planning.";
  return "Humidity is in a fairly comfortable middle range.";
}

function windNote(value: number | null) {
  if (value === null) return "Wind data is unavailable.";
  if (value >= 25) return "Wind is strong enough to influence commute comfort and layering.";
  if (value >= 15) return "A breezy day where light outerwear may help.";
  return "Wind should stay fairly manageable.";
}

function uvNote(value: number | null) {
  if (value === null) return "UV data is unavailable.";
  if (value >= 8) return "Strong UV exposure today, so skin protection matters.";
  if (value >= 5) return "Moderate UV levels make sunscreen worth planning for.";
  return "UV pressure looks fairly light right now.";
}

function aqiNote(value: number | null) {
  if (value === null) return "Air quality data is unavailable.";
  if (value >= 100) return "Air quality is poor enough to shape outdoor decisions.";
  if (value >= 60) return "Some air quality sensitivity may show up during longer outdoor periods.";
  return "Air quality looks relatively comfortable.";
}

function rainNote(value: number | null) {
  if (value === null) return "Rain probability is unavailable.";
  if (value >= 70) return "A rain-ready plan is the safer choice today.";
  if (value >= 35) return "Showers are possible, so timing flexibility could help.";
  return "Rain risk is fairly low at the moment.";
}
