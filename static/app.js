const cityEl = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const matchesEl = document.getElementById("matches");
const currentEl = document.getElementById("current");
const hourlyEl = document.getElementById("hourly");

function wcToText(code) {
  // Simple mapping (you can expand later)
  const m = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    95: "Thunderstorm"
  };
  return m[code] ?? `Weather code ${code}`;
}

async function geocodeCity(name) {
  const url = new URL("/api/geocode", window.location.origin);
  url.searchParams.set("name", name);
  const res = await fetch(url);
  return await res.json();
}

async function fetchWeather(lat, lon) {
  const url = new URL("/api/weather", window.location.origin);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  const res = await fetch(url);
  return await res.json();
}

function renderMatches(matches) {
  if (!matches.length) {
    matchesEl.innerHTML = "No matches found.";
    return;
  }

  matchesEl.innerHTML = `
    <div class="subtle">Select a location:</div>
    <div class="list">
      ${matches.map((m, i) => `
        <button class="choice" data-lat="${m.latitude}" data-lon="${m.longitude}">
          ${m.name}${m.admin1 ? ", " + m.admin1 : ""}${m.country ? " (" + m.country + ")" : ""}
        </button>
      `).join("")}
    </div>
  `;

  matchesEl.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", async () => {
      const lat = btn.getAttribute("data-lat");
      const lon = btn.getAttribute("data-lon");
      await renderWeather(lat, lon);
    });
  });
}

function renderCurrent(data) {
  const c = data.current;
  const u = data.current_units;

  currentEl.innerHTML = `
    <h2>Current</h2>
    <div class="grid">
      <div><b>Temp</b><br>${c.temperature_2m}${u.temperature_2m}</div>
      <div><b>Feels</b><br>${c.apparent_temperature}${u.apparent_temperature}</div>
      <div><b>Humidity</b><br>${c.relative_humidity_2m}${u.relative_humidity_2m}</div>
      <div><b>Wind</b><br>${c.wind_speed_10m}${u.wind_speed_10m}</div>
      <div><b>Condition</b><br>${wcToText(c.weather_code)}</div>
      <div><b>Time</b><br>${c.time}</div>
    </div>
  `;
}

function renderHourly(data) {
  const h = data.hourly;
  hourlyEl.innerHTML = `
    <h2>Next 24 hours</h2>
    <div class="hourly">
      ${h.time.map((t, i) => `
        <div class="hour">
          <div class="subtle">${t.slice(11, 16)}</div>
          <div><b>${h.temperature_2m[i]}°</b></div>
          <div class="subtle">${wcToText(h.weather_code[i])}</div>
          <div class="subtle">💧 ${h.precipitation_probability[i]}%</div>
          <div class="subtle">🌬️ ${h.wind_speed_10m[i]}</div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderWeather(lat, lon) {
  matchesEl.innerHTML = `<span class="subtle">Loading forecast…</span>`;
  const data = await fetchWeather(lat, lon);
  matchesEl.innerHTML = `<span class="subtle">Lat ${data.latitude}, Lon ${data.longitude} (${data.timezone})</span>`;
  renderCurrent(data);
  renderHourly(data);
}

searchBtn.addEventListener("click", async () => {
  const name = cityEl.value.trim();
  if (!name) return;

  matchesEl.innerHTML = `<span class="subtle">Searching…</span>`;
  currentEl.innerHTML = "";
  hourlyEl.innerHTML = "";

  const matches = await geocodeCity(name);
  renderMatches(matches);
});
