"""
Sanora API — FastAPI backend for AI-powered outfit recommendations.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import wardrobe, outfits, history

load_dotenv()

app = FastAPI(
    title="Sanora API",
    description="AI-powered outfit recommendation backend",
    version="1.0.0",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5500")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wardrobe.router, prefix="/wardrobe", tags=["Wardrobe"])
app.include_router(outfits.router, prefix="/outfits", tags=["Outfits"])
app.include_router(history.router, prefix="/history", tags=["History"])

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check — confirms the API is up and shows active LLM provider."""
    return {"status": "ok", "llm_provider": os.getenv("LLM_PROVIDER", "mock"), "version": "1.0.0"}
