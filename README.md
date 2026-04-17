# Weather Based Life Assistant

Full-stack weather assistant built with:

- `FastAPI` backend
- `Next.js` frontend
- `Tailwind CSS` for styling
- `Recharts` for the hourly chart
- `Open-Meteo` for weather, air quality, UV, AQI, PM2.5, PM10, and pollen data when available

## Completed modules

- Outfit Planner
- Health and Skincare
- Commute Optimizer
- Event Planner

## Backend features

- `GET /api/weather`
  Geocodes a city, fetches weather and air quality, and normalizes the response into one internal schema.

- `GET /api/recommendations`
  Reuses the normalized weather pipeline and runs the rule-based engines for outfit, health, commute, and events.

Backend service files:

- [services/weather_service.py](/d:/cs stuff/wa/services/weather_service.py)
- [services/air_quality_service.py](/d:/cs stuff/wa/services/air_quality_service.py)
- [services/scoring_service.py](/d:/cs stuff/wa/services/scoring_service.py)
- [services/outfit_engine.py](/d:/cs stuff/wa/services/outfit_engine.py)
- [services/health_engine.py](/d:/cs stuff/wa/services/health_engine.py)
- [services/commute_engine.py](/d:/cs stuff/wa/services/commute_engine.py)
- [services/event_engine.py](/d:/cs stuff/wa/services/event_engine.py)

## Frontend features

- homepage dashboard with city search
- current weather overview
- hourly chart
- metric cards
- summary score cards
- separate pages for outfit, health, commute, and events
- local preference storage with `localStorage`

Preferences currently saved locally:

- default city
- unit system
- commute mode
- outfit style
- skin sensitivity
- allergy sensitivity
- pollution sensitivity

## Run the backend

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend runs at `http://127.0.0.1:8000`

Useful backend routes:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/api/weather?city=Boston&unit=metric`
- `http://127.0.0.1:8000/api/recommendations?city=Boston&unit=metric`

## Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:3000`

The frontend expects the backend at `http://127.0.0.1:8000` by default.

If you need a different API base URL, create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Notes

- Recommendation logic is rules-based, not ML.
- Local preferences are frontend-only storage right now.
- In this environment I could verify the Python side directly, but I could not complete a live `npm install` or browser run for Next.js here.
