# weatherapp
creating virtual environment:
python -m venv venv
source venv/bin/activate

installing depndencies:
pip install fastapi uvicorn jinja2 httpx
    fastapi → backend framework
    uvicorn → ASGI server to run FastAPI
    jinja2 → HTML templating
    httpx → async HTTP requests to Open-Meteo API
uvicorn app:app --reload