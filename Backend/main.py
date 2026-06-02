# Punto de entrada — uvicorn main:app --host 0.0.0.0

from app.factory import create_app

app = create_app()
