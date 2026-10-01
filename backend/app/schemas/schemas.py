"""Pydantic schemas for request validation and response serialization."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

# ── Clothing Items ────────────────────────────────────────────────

class ClothingItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., description="top|bottom|dupatta|footwear|accessory|outerwear|full-outfit")
    style_type: list[str] = Field(default_factory=list)
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    season: list[str] = Field(default=["all"])
    occasion: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)

class ClothingItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    style_type: Optional[list[str]] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    season: Optional[list[str]] = None
    occasion: Optional[list[str]] = None
    tags: Optional[list[str]] = None

class ClothingItemResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    style_type: list[str]
    primary_color: Optional[str]
    secondary_color: Optional[str]
    season: list[str]
    occasion: list[str]
    image_url: Optional[str]
    tags: list[str]
    created_at: str

# ── Outfit Recommendations ────────────────────────────────────────

class OutfitRecommendRequest(BaseModel):
    style_type: str
    occasion: str
    mood: str = Field(..., description="bold|minimal|romantic|dreamy|classic|festive")
    excluded_combos: list[str] = Field(default_factory=list, description="List of combo hashes to skip")
    locked_items: list[str] = Field(default_factory=list, description="List of item IDs to keep fixed")

class SurpriseRequest(BaseModel):
    excluded_combos: list[str] = Field(default_factory=list, description="List of combo hashes to skip")
    locked_items: list[str] = Field(default_factory=list, description="List of item IDs to keep fixed")

class SuggestedOutfit(BaseModel):
    items: list[ClothingItemResponse]
    ai_description: str

class OutfitRecommendResponse(BaseModel):
    outfits: list[SuggestedOutfit]
    suggestion_ids: list[str]

# ── Saved Outfits ─────────────────────────────────────────────────

class OutfitSuggestionResponse(BaseModel):
    id: str
    item_ids: list[str]
    ai_description: Optional[str]
    occasion: Optional[str]
    style_type: Optional[str]
    mood: Optional[str]
    saved: bool
    created_at: str

# ── Outfit History ────────────────────────────────────────────────

class HistoryCreate(BaseModel):
    outfit_id: str
    worn_on: date
    notes: Optional[str] = Field(None, max_length=500)

class HistoryResponse(BaseModel):
    id: str
    outfit_id: Optional[str]
    worn_on: str
    notes: Optional[str]
    created_at: str
    outfit_details: Optional[OutfitSuggestionResponse] = None
    clothing_items: list[ClothingItemResponse] = Field(default_factory=list)
