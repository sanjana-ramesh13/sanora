"""Outfit recommendation and saving endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta, timezone
from app.auth.supabase_auth import get_current_user_id
from app.database import get_supabase
from app.schemas.schemas import OutfitRecommendRequest, OutfitRecommendResponse, OutfitSuggestionResponse, SurpriseRequest
from app.services.ai_service import generate_outfit_recommendations

router = APIRouter()


def get_combo_history(user_id: str, db) -> dict[str, str]:
    """Returns a dict mapping combo hash -> most recent worn_on date ISO string."""
    history_res = db.table("outfit_history").select("outfit_id, worn_on").eq("user_id", user_id).order("worn_on", desc=True).execute()
    history_entries = history_res.data or []
    
    if not history_entries:
        return {}
        
    outfit_ids = list(set(h["outfit_id"] for h in history_entries if h.get("outfit_id")))
    if not outfit_ids:
        return {}
        
    outfits_res = db.table("outfit_suggestions").select("id, item_ids").in_("id", outfit_ids).execute()
    outfits = outfits_res.data or []
    outfit_map = {o["id"]: "-".join(sorted(o["item_ids"])) for o in outfits if o.get("item_ids")}
    
    hash_to_date = {}
    for h in history_entries:
        oid = h.get("outfit_id")
        if oid in outfit_map:
            combo_hash = outfit_map[oid]
            if combo_hash not in hash_to_date:
                hash_to_date[combo_hash] = h["worn_on"]
                
    return hash_to_date


@router.post("/recommend", response_model=OutfitRecommendResponse)
async def recommend_outfits(request: OutfitRecommendRequest, user_id: str = Depends(get_current_user_id)):
    """Generate AI outfit suggestions from the user's wardrobe (up to 3 combos)."""
    db = get_supabase()
    wardrobe = db.table("clothing_items").select("*").eq("user_id", user_id).execute().data or []
    if not wardrobe:
        raise HTTPException(status_code=422, detail="Your closet is empty! Add some clothes first.")
        
    history_map = get_combo_history(user_id, db)
    recommendations = await generate_outfit_recommendations(wardrobe, request, history_map)
    if not recommendations:
        raise HTTPException(status_code=422, detail="Couldn't build an outfit from your wardrobe. Try adding more items or changing the style/occasion.")
    saved_ids: list[str] = []
    for rec in recommendations:
        row = db.table("outfit_suggestions").insert({
            "user_id": user_id,
            "item_ids": [i["id"] for i in rec["items"]],
            "ai_description": rec["ai_description"],
            "occasion": request.occasion,
            "style_type": request.style_type,
            "mood": request.mood,
        }).execute()
        if row.data:
            saved_ids.append(row.data[0]["id"])
    return OutfitRecommendResponse(outfits=recommendations, suggestion_ids=saved_ids)


@router.post("/surprise", response_model=OutfitRecommendResponse)
async def surprise_outfit(request: SurpriseRequest, user_id: str = Depends(get_current_user_id)):
    """Generate a random valid outfit combination."""
    import random
    from app.services.rule_engine import build_outfit_combinations
    from app.services.ai_service import _TEMPLATES
    
    db = get_supabase()
    wardrobe = db.table("clothing_items").select("*").eq("user_id", user_id).execute().data or []
    if not wardrobe:
        raise HTTPException(status_code=422, detail="Your closet is empty! Add some clothes first.")
        
    # Shuffle the wardrobe to randomize the outfit combination selection
    random.shuffle(wardrobe)
    
    # Get history map and filter for 7-day cutoff
    history_map = get_combo_history(user_id, db)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_hashes = [h for h, d in history_map.items() if d >= cutoff]
    
    base_excluded = request.excluded_combos or []
    
    # We do not apply style or occasion filters, just directly build combinations!
    combos = build_outfit_combinations(
        wardrobe, 
        max_outfits=1, 
        excluded_combos=base_excluded + recent_hashes, 
        locked_items=request.locked_items
    )
    
    if not combos:
        # Fallback: ignore 7-day rule, fetch all valid, sort by oldest worn
        fallback_combos = build_outfit_combinations(
            wardrobe, 
            max_outfits=1000, 
            excluded_combos=base_excluded, 
            locked_items=request.locked_items
        )
        if not fallback_combos:
            raise HTTPException(status_code=422, detail="Couldn't build any more surprise outfits from your closet!")
            
        def get_combo_hash(combo: list[dict]) -> str:
            return "-".join(sorted(item["id"] for item in combo))
            
        fallback_combos.sort(key=lambda c: history_map.get(get_combo_hash(c), "0000-00-00"))
        combo = fallback_combos[0]
    else:
        combo = combos[0]
    
    # Give it a fun, random surprise tip
    key_item = combo[0]["name"] if combo else "your chosen piece"
    tip = random.choice(_TEMPLATES).format(mood="surprise", occasion="any", key_item=key_item)
    
    recommendation = {"items": combo, "ai_description": tip}
    
    # Save it to outfit suggestions so history logic still works
    saved_ids = []
    row = db.table("outfit_suggestions").insert({
        "user_id": user_id,
        "item_ids": [i["id"] for i in combo],
        "ai_description": tip,
        "occasion": "surprise",
        "style_type": "surprise",
        "mood": "surprise",
    }).execute()
    if row.data:
        saved_ids.append(row.data[0]["id"])
        
    return OutfitRecommendResponse(outfits=[recommendation], suggestion_ids=saved_ids)


@router.get("/saved", response_model=list[OutfitSuggestionResponse])
async def list_saved_outfits(user_id: str = Depends(get_current_user_id)):
    """Return all bookmarked outfit suggestions."""
    db = get_supabase()
    result = db.table("outfit_suggestions").select("*").eq("user_id", user_id).eq("saved", True).order("created_at", desc=True).execute()
    return result.data or []


@router.patch("/{outfit_id}/save", response_model=OutfitSuggestionResponse)
async def toggle_save(outfit_id: str, saved: bool = Query(...), user_id: str = Depends(get_current_user_id)):
    """Toggle the saved/bookmarked state of an outfit suggestion."""
    db = get_supabase()
    result = db.table("outfit_suggestions").update({"saved": saved}).eq("id", outfit_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Outfit not found.")
    return result.data[0]
