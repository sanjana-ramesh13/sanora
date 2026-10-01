"""
Outfit recommendation orchestrator.
Uses the rule engine to filter and assemble outfits, and assigns a simple internal description.
"""
from app.services.rule_engine import filter_items, build_outfit_combinations
from app.schemas.schemas import OutfitRecommendRequest
import random

_TEMPLATES = [
    "This {mood} ensemble is precisely right for a {occasion} setting. "
    "The {key_item} anchors the look with effortless elegance, while every supporting piece earns its place. "
    "Confidence is your best accessory.",

    "A beautifully considered {mood} combination for {occasion}. "
    "Centred around your {key_item}, the outfit feels cohesive without trying too hard. "
    "Polished, intentional, and completely you.",

    "For a {occasion} occasion, this {mood} outfit strikes all the right notes. "
    "Let your {key_item} be the star — keep accessories minimal to let it breathe. "
    "The result is quietly stunning.",

    "This pairing achieves the ideal balance between comfort and style, perfect for {occasion}. "
    "The {mood} energy comes through effortlessly — put-together without being overdone.",

    "Rooted in {mood} sensibility, this {occasion} look is a testament to thoughtful dressing. "
    "Your {key_item} sets the tone, with each piece working in quiet harmony around it.",

    "The {key_item} is doing beautiful work here, giving this {mood} look real personality. "
    "Dressed for {occasion}, this reads as curated and self-assured — the kind of outfit that turns heads.",
]

async def generate_outfit_recommendations(wardrobe: list[dict], request: OutfitRecommendRequest, history_map: dict[str, str] = None) -> list[dict]:
    """
    1. Rule engine filters + assembles outfit combos
    2. Fallback text generation provides styling tip
    Returns: [{items: [...], ai_description: str}, ...]
    """
    if history_map is None:
        history_map = {}
        
    from datetime import datetime, timedelta, timezone
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_hashes = [h for h, d in history_map.items() if d >= cutoff]
    
    base_excluded = getattr(request, "excluded_combos", []) or []
    locked = getattr(request, "locked_items", []) or []
    
    filtered = filter_items(wardrobe, request.style_type, request.occasion)
    
    # Try WITH 7-day exclusions
    combos = build_outfit_combinations(
        filtered, 
        max_outfits=1, 
        excluded_combos=base_excluded + recent_hashes,
        locked_items=locked
    )
    
    if not combos:
        # Fallback WITHOUT 7-day exclusions (fetch all possible)
        fallback_combos = build_outfit_combinations(
            filtered, 
            max_outfits=1000, 
            excluded_combos=base_excluded,
            locked_items=locked
        )
        if not fallback_combos:
            return []
            
        def get_combo_hash(combo: list[dict]) -> str:
            return "-".join(sorted(item["id"] for item in combo))
            
        # Sort by worn_on ascending (oldest first).
        fallback_combos.sort(key=lambda c: history_map.get(get_combo_hash(c), "0000-00-00"))
        combos = [fallback_combos[0]]
    
    results = []
    for combo in combos:
        key_item = combo[0]["name"] if combo else "your chosen piece"
        tip = random.choice(_TEMPLATES).format(mood=request.mood, occasion=request.occasion, key_item=key_item)
        results.append({"items": combo, "ai_description": tip})
        
    return results
