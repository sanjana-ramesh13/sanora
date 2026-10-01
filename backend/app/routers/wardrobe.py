"""Wardrobe (clothing items) CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.auth.supabase_auth import get_current_user_id
from app.database import get_supabase
from app.schemas.schemas import ClothingItemCreate, ClothingItemResponse, ClothingItemUpdate

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
_ALLOWED_EXTS  = {"jpg", "jpeg", "png", "webp"}


@router.patch("/items/{item_id}", response_model=ClothingItemResponse)
async def update_item(item_id: str, item_update: ClothingItemUpdate, user_id: str = Depends(get_current_user_id)):
    """Update an existing clothing item."""
    db = get_supabase()
    payload = {k: v for k, v in item_update.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields provided to update.")
    
    result = db.table("clothing_items").update(payload).eq("id", item_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Clothing item not found.")
    return result.data[0]

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
_ALLOWED_EXTS  = {"jpg", "jpeg", "png", "webp"}


@router.get("/items", response_model=list[ClothingItemResponse])
async def list_items(user_id: str = Depends(get_current_user_id)):
    """Return all clothing items for the authenticated user, newest first."""
    db = get_supabase()
    result = db.table("clothing_items").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data or []


@router.post("/items", response_model=ClothingItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item: ClothingItemCreate, user_id: str = Depends(get_current_user_id)):
    """Add a new clothing item to the wardrobe."""
    db = get_supabase()
    payload = item.model_dump()
    payload["user_id"] = user_id
    result = db.table("clothing_items").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create clothing item.")
    return result.data[0]


@router.post("/items/{item_id}/upload-image", response_model=ClothingItemResponse)
async def upload_image(item_id: str, file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Upload a photo for a clothing item. Stores in Supabase Storage."""
    db = get_supabase()
    existing = db.table("clothing_items").select("id").eq("id", item_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Clothing item not found.")
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Accepted: JPG, PNG, WebP.")
    ext = (file.filename or "upload").rsplit(".", 1)[-1].lower()
    if ext not in _ALLOWED_EXTS:
        ext = "jpg"
    contents = await file.read()
    storage_path = f"{user_id}/{item_id}.{ext}"
    try:
        db.storage.from_("clothing-images").upload(
            path=storage_path, file=contents,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {exc}")
    image_url: str = db.storage.from_("clothing-images").get_public_url(storage_path)
    if image_url.endswith("?"):
        image_url = image_url[:-1]
    result = db.table("clothing_items").update({"image_url": image_url}).eq("id", item_id).execute()
    return result.data[0]


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a clothing item and its image from Storage."""
    db = get_supabase()
    item_result = db.table("clothing_items").select("image_url").eq("id", item_id).eq("user_id", user_id).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Clothing item not found.")
    db.table("clothing_items").delete().eq("id", item_id).eq("user_id", user_id).execute()
    item = item_result.data[0]
    if item.get("image_url"):
        try:
            for ext in _ALLOWED_EXTS:
                db.storage.from_("clothing-images").remove([f"{user_id}/{item_id}.{ext}"])
        except Exception:
            pass  # non-fatal
    return None
