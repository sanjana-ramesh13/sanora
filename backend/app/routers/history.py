"""Outfit history endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from app.auth.supabase_auth import get_current_user_id
from app.database import get_supabase
from app.schemas.schemas import HistoryCreate, HistoryResponse

router = APIRouter()


@router.get("/", response_model=list[HistoryResponse])
async def list_history(user_id: str = Depends(get_current_user_id)):
    """Return full outfit history with clothing items included, most recent first."""
    db = get_supabase()
    
    # 1. Fetch history
    history_res = db.table("outfit_history").select("*").eq("user_id", user_id).order("worn_on", desc=True).execute()
    history_entries = history_res.data or []
    
    if not history_entries:
        return []
        
    # 2. Extract outfit IDs
    outfit_ids = [h["outfit_id"] for h in history_entries if h.get("outfit_id")]
    
    # 3. Fetch outfits and their items
    outfits_map = {}
    items_map = {}
    
    if outfit_ids:
        outfits_res = db.table("outfit_suggestions").select("*").in_("id", outfit_ids).execute()
        outfits = outfits_res.data or []
        
        all_item_ids = []
        for o in outfits:
            outfits_map[o["id"]] = o
            if o.get("item_ids"):
                all_item_ids.extend(o["item_ids"])
                
        if all_item_ids:
            # Deduplicate item IDs
            all_item_ids = list(set(all_item_ids))
            items_res = db.table("clothing_items").select("*").in_("id", all_item_ids).execute()
            for item in (items_res.data or []):
                items_map[item["id"]] = item
                
    # 4. Assemble the rich response
    results = []
    for h in history_entries:
        outfit_data = None
        clothing_items = []
        
        if h.get("outfit_id") and h["outfit_id"] in outfits_map:
            outfit_data = outfits_map[h["outfit_id"]]
            if outfit_data.get("item_ids"):
                for iid in outfit_data["item_ids"]:
                    if iid in items_map:
                        clothing_items.append(items_map[iid])
                        
        h["outfit_details"] = outfit_data
        h["clothing_items"] = clothing_items
        results.append(h)
        
    return results


@router.post("/", response_model=HistoryResponse, status_code=201)
async def log_outfit(entry: HistoryCreate, user_id: str = Depends(get_current_user_id)):
    """Log an outfit as worn on a given date."""
    db = get_supabase()
    payload = {"user_id": user_id, "outfit_id": entry.outfit_id, "worn_on": entry.worn_on.isoformat(), "notes": entry.notes}
    result = db.table("outfit_history").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log history entry.")
    return result.data[0]


@router.delete("/{entry_id}", status_code=204)
async def delete_history_entry(entry_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a history entry."""
    db = get_supabase()
    db.table("outfit_history").delete().eq("id", entry_id).eq("user_id", user_id).execute()
    return None
