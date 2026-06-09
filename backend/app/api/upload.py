import uuid
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.auth import get_current_teacher
from app.models.teacher import Teacher

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
BUCKET_NAME = "quiz-images"


async def _upload_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Upload raw bytes to Supabase Storage using the REST API directly (no SDK needed).
    Returns the public CDN URL of the uploaded file.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase storage is not configured on this server."
        )

    storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",  # overwrite if same name
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(storage_url, content=file_bytes, headers=headers)

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail=f"Failed to upload image to storage: {response.text}"
        )

    # Construct the public URL
    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
    return public_url


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    """
    Upload a question image to Supabase Storage.
    Returns the permanent public CDN URL.
    Only authenticated teachers can upload.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum size is 5MB."
        )

    # Generate a unique filename to avoid collisions
    extension = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{extension}"

    # Upload to Supabase
    public_url = await _upload_to_supabase(file_bytes, unique_filename, file.content_type)

    return JSONResponse({"url": public_url})
