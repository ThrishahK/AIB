import uvicorn
from fastapi import FastAPI
from .routes import router
from .db import init_db
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Interview Bot - Backend")
# CORS settings
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # allow your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include router with /api prefix
app.include_router(router, prefix="/api")

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
