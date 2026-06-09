from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import asyncio
import requests
import bcrypt
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query, Header
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# -------- ENV --------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@auto-markt.de').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin123!')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
APP_NAME = os.environ.get('APP_NAME', 'auto-markt')
DEALER_AUTO_APPROVE = os.environ.get('DEALER_AUTO_APPROVE', 'false').lower() == 'true'

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
storage_key = None

# -------- DB --------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# -------- APP --------
app = FastAPI(title="Auto-Marktplatz API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("auto-markt")


# -------- Helpers --------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def sanitize_user(u: dict) -> dict:
    if not u:
        return u
    u = dict(u)
    u.pop('password_hash', None)
    u.pop('_id', None)
    return u

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get('type') != 'access':
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        user = await db.users.find_one({"id": payload['sub']})
        if not user:
            raise HTTPException(status_code=401, detail="Nutzer nicht gefunden")
        return sanitize_user(user)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token abgelaufen")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")

async def require_dealer(user: dict = Depends(get_current_user)) -> dict:
    if user.get('role') != 'dealer':
        raise HTTPException(status_code=403, detail="Nur für Händler")
    if user.get('status') != 'approved':
        raise HTTPException(status_code=403, detail="Händler noch nicht freigegeben")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Nur für Admins")
    return user


# -------- Object Storage --------
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY fehlt")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# -------- Models --------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class VehicleIn(BaseModel):
    title: str
    brand: str
    model: str
    year: int
    price: float
    mileage: int
    fuel: str  # Benzin, Diesel, Elektro, Hybrid
    transmission: str  # Schaltung, Automatik
    power_hp: int
    description: str
    location: str
    images: List[str] = []  # storage paths

class VehicleUpdate(BaseModel):
    title: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    mileage: Optional[int] = None
    fuel: Optional[str] = None
    transmission: Optional[str] = None
    power_hp: Optional[int] = None
    description: Optional[str] = None
    location: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None  # draft, published, deactivated

class InquiryIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class AIDescribeIn(BaseModel):
    brand: str
    model: str
    year: int
    mileage: int
    fuel: str
    transmission: str
    power_hp: int
    extra: Optional[str] = ""


# -------- Auth Routes --------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    user_id = str(uuid.uuid4())
    status = "approved" if DEALER_AUTO_APPROVE else "pending"
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "company": payload.company or "",
        "phone": payload.phone or "",
        "role": "dealer",
        "status": status,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email, "dealer")
    return {"token": token, "user": sanitize_user(doc)}

@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    token = create_access_token(user['id'], user['email'], user['role'])
    return {"token": token, "user": sanitize_user(user)}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# -------- Public Vehicles --------
def _vehicle_query(params):
    q = {"status": "published"}
    if params.get('brand'):
        q['brand'] = params['brand']
    if params.get('fuel'):
        q['fuel'] = params['fuel']
    if params.get('transmission'):
        q['transmission'] = params['transmission']
    if params.get('location'):
        q['location'] = {"$regex": params['location'], "$options": "i"}
    price_q = {}
    if params.get('min_price') is not None:
        price_q['$gte'] = float(params['min_price'])
    if params.get('max_price') is not None:
        price_q['$lte'] = float(params['max_price'])
    if price_q:
        q['price'] = price_q
    year_q = {}
    if params.get('min_year') is not None:
        year_q['$gte'] = int(params['min_year'])
    if params.get('max_year') is not None:
        year_q['$lte'] = int(params['max_year'])
    if year_q:
        q['year'] = year_q
    if params.get('max_mileage') is not None:
        q['mileage'] = {"$lte": int(params['max_mileage'])}
    if params.get('search'):
        s = params['search']
        q['$or'] = [
            {'title': {"$regex": s, "$options": "i"}},
            {'brand': {"$regex": s, "$options": "i"}},
            {'model': {"$regex": s, "$options": "i"}},
            {'description': {"$regex": s, "$options": "i"}},
        ]
    return q

@api.get("/vehicles")
async def list_vehicles(
    brand: Optional[str] = None,
    fuel: Optional[str] = None,
    transmission: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    max_mileage: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    skip: int = 0,
    limit: int = 24,
):
    q = _vehicle_query(locals())
    sort_field, sort_dir = {
        "price_asc": ("price", 1),
        "price_desc": ("price", -1),
        "year_desc": ("year", -1),
        "year_asc": ("year", 1),
        "mileage_asc": ("mileage", 1),
        "newest": ("created_at", -1),
    }.get(sort or "newest", ("created_at", -1))
    cursor = db.vehicles.find(q, {"_id": 0}).sort(sort_field, sort_dir).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.vehicles.count_documents(q)
    return {"items": items, "total": total}

@api.get("/vehicles/featured")
async def featured_vehicles():
    cursor = db.vehicles.find({"status": "published"}, {"_id": 0}).sort("created_at", -1).limit(6)
    items = await cursor.to_list(length=6)
    return {"items": items}

@api.get("/vehicles/facets")
async def facets():
    pipeline_brands = [{"$match": {"status": "published"}}, {"$group": {"_id": "$brand", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]
    brands = await db.vehicles.aggregate(pipeline_brands).to_list(length=200)
    return {
        "brands": [{"name": b["_id"], "count": b["count"]} for b in brands if b["_id"]],
        "fuels": ["Benzin", "Diesel", "Elektro", "Hybrid", "LPG/Autogas"],
        "transmissions": ["Schaltung", "Automatik"],
    }

@api.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    v = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not v or v.get('status') != 'published':
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    # increment views (fire-and-forget, ignore failures)
    try:
        await db.vehicles.update_one({"id": vehicle_id}, {"$inc": {"views": 1}})
        v['views'] = (v.get('views') or 0) + 1
    except Exception:
        pass
    dealer = await db.users.find_one({"id": v.get('dealer_id')}, {"_id": 0, "password_hash": 0})
    if dealer:
        v['dealer'] = {"id": dealer['id'], "name": dealer.get('name'), "company": dealer.get('company'), "phone": dealer.get('phone'), "location": v.get('location')}
    return v

@api.post("/vehicles/by-ids")
async def vehicles_by_ids(body: dict):
    ids = body.get("ids") or []
    if not isinstance(ids, list) or not ids:
        return {"items": []}
    items = await db.vehicles.find({"id": {"$in": ids}, "status": "published"}, {"_id": 0}).to_list(length=200)
    return {"items": items}


# -------- Dealer Vehicle CRUD --------
@api.get("/dealer/vehicles")
async def dealer_list(user: dict = Depends(require_dealer)):
    cursor = db.vehicles.find({"dealer_id": user['id']}, {"_id": 0}).sort("created_at", -1)
    return {"items": await cursor.to_list(length=500)}

@api.get("/dealer/vehicles/{vehicle_id}")
async def dealer_get(vehicle_id: str, user: dict = Depends(require_dealer)):
    v = await db.vehicles.find_one({"id": vehicle_id, "dealer_id": user['id']}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return v

@api.post("/dealer/vehicles")
async def dealer_create(payload: VehicleIn, user: dict = Depends(require_dealer)):
    vid = str(uuid.uuid4())
    doc = payload.model_dump()
    doc.update({
        "id": vid,
        "dealer_id": user['id'],
        "dealer_name": user.get('company') or user.get('name'),
        "status": "published",
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "views": 0,
    })
    await db.vehicles.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api.patch("/dealer/vehicles/{vehicle_id}")
async def dealer_update(vehicle_id: str, payload: VehicleUpdate, user: dict = Depends(require_dealer)):
    v = await db.vehicles.find_one({"id": vehicle_id, "dealer_id": user['id']})
    if not v:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    updates = {k: val for k, val in payload.model_dump(exclude_none=True).items()}
    if updates:
        updates['updated_at'] = now_iso()
        await db.vehicles.update_one({"id": vehicle_id}, {"$set": updates})
    new_v = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    return new_v

@api.delete("/dealer/vehicles/{vehicle_id}")
async def dealer_delete(vehicle_id: str, user: dict = Depends(require_dealer)):
    r = await db.vehicles.delete_one({"id": vehicle_id, "dealer_id": user['id']})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return {"ok": True}

@api.get("/dealer/stats")
async def dealer_stats(user: dict = Depends(require_dealer)):
    total = await db.vehicles.count_documents({"dealer_id": user['id']})
    published = await db.vehicles.count_documents({"dealer_id": user['id'], "status": "published"})
    inquiries = await db.inquiries.count_documents({"dealer_id": user['id']})
    unread = await db.inquiries.count_documents({"dealer_id": user['id'], "read": False})
    return {"total_listings": total, "published_listings": published, "total_inquiries": inquiries, "unread_inquiries": unread}

@api.get("/dealer/analytics")
async def dealer_analytics(user: dict = Depends(require_dealer)):
    vehicles = await db.vehicles.find({"dealer_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    # inquiry counts per vehicle
    pipeline = [
        {"$match": {"dealer_id": user['id']}},
        {"$group": {"_id": "$vehicle_id", "count": {"$sum": 1}}},
    ]
    inq_counts = await db.inquiries.aggregate(pipeline).to_list(length=1000)
    inq_map = {r["_id"]: r["count"] for r in inq_counts}

    per_vehicle = []
    total_views = 0
    total_leads = 0
    for v in vehicles:
        views = int(v.get("views") or 0)
        leads = int(inq_map.get(v["id"], 0))
        conv = round((leads / views * 100), 1) if views > 0 else 0.0
        per_vehicle.append({
            "id": v["id"],
            "title": v["title"],
            "brand": v.get("brand"),
            "model": v.get("model"),
            "status": v.get("status"),
            "image": (v.get("images") or [None])[0],
            "views": views,
            "leads": leads,
            "conversion": conv,
        })
        total_views += views
        total_leads += leads

    overall_conv = round((total_leads / total_views * 100), 1) if total_views > 0 else 0.0
    # top performers by views
    top_views = sorted(per_vehicle, key=lambda x: x["views"], reverse=True)[:5]
    top_leads = sorted(per_vehicle, key=lambda x: x["leads"], reverse=True)[:5]
    return {
        "total_views": total_views,
        "total_leads": total_leads,
        "overall_conversion": overall_conv,
        "active_listings": sum(1 for v in vehicles if v.get("status") == "published"),
        "per_vehicle": per_vehicle,
        "top_views": top_views,
        "top_leads": top_leads,
    }


# -------- Inquiries --------
@api.post("/vehicles/{vehicle_id}/inquiries")
async def create_inquiry(vehicle_id: str, payload: InquiryIn):
    v = await db.vehicles.find_one({"id": vehicle_id})
    if not v:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    doc = payload.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "vehicle_id": vehicle_id,
        "vehicle_title": v.get('title'),
        "dealer_id": v.get('dealer_id'),
        "read": False,
        "created_at": now_iso(),
    })
    await db.inquiries.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api.get("/dealer/inquiries")
async def dealer_inquiries(user: dict = Depends(require_dealer)):
    cursor = db.inquiries.find({"dealer_id": user['id']}, {"_id": 0}).sort("created_at", -1)
    return {"items": await cursor.to_list(length=500)}

@api.patch("/dealer/inquiries/{inq_id}/read")
async def mark_read(inq_id: str, user: dict = Depends(require_dealer)):
    r = await db.inquiries.update_one({"id": inq_id, "dealer_id": user['id']}, {"$set": {"read": True}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return {"ok": True}


# -------- Files --------
@api.post("/files/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(require_dealer)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Nur Bilddateien erlaubt")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Maximale Dateigröße 8MB")
    ext = (file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg').lower()
    path = f"{APP_NAME}/cars/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, file.content_type)
    except Exception as e:
        logger.exception("Storage upload fail")
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {e}")
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "owner_id": user['id'],
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api.get("/files/{path:path}")
async def download_file(path: str):
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not rec:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    try:
        data, ct = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    return Response(content=data, media_type=rec.get("content_type") or ct)


# -------- AI Description (GPT-5.2) --------
@api.post("/ai/describe")
async def ai_describe(payload: AIDescribeIn, user: dict = Depends(require_dealer)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Bibliothek nicht verfügbar: {e}")

    system = (
        "Du bist ein erfahrener deutscher Autohändler-Texter. "
        "Schreibe einen professionellen, vertrauensvollen Fahrzeug-Inseratstext auf Deutsch. "
        "Strukturiere in 3 kurze Absätze: 1) Übersicht & Highlights, 2) Technische Details, 3) Empfehlung & Call-to-Action. "
        "Keine Übertreibungen, keine Garantien, keine Preisangaben. 120-180 Wörter."
    )
    prompt = (
        f"Erstelle einen Inseratstext für: {payload.brand} {payload.model}, "
        f"Baujahr {payload.year}, {payload.mileage} km, "
        f"Kraftstoff: {payload.fuel}, Getriebe: {payload.transmission}, "
        f"Leistung: {payload.power_hp} PS. "
        f"Zusatzinfos vom Händler: {payload.extra or 'keine'}."
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"describe-{user['id']}-{uuid.uuid4()}",
        system_message=system,
    ).with_model("openai", "gpt-5.2")

    async def event_gen():
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    # SSE format
                    content = ev.content.replace("\n", "\\n")
                    yield f"data: {content}\n\n"
                elif isinstance(ev, StreamDone):
                    yield "event: done\ndata: [DONE]\n\n"
                    break
        except Exception as e:
            logger.exception("AI stream error")
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# -------- Admin --------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    return {
        "dealers_total": await db.users.count_documents({"role": "dealer"}),
        "dealers_pending": await db.users.count_documents({"role": "dealer", "status": "pending"}),
        "dealers_approved": await db.users.count_documents({"role": "dealer", "status": "approved"}),
        "vehicles_total": await db.vehicles.count_documents({}),
        "vehicles_published": await db.vehicles.count_documents({"status": "published"}),
        "vehicles_deactivated": await db.vehicles.count_documents({"status": "deactivated"}),
        "inquiries_total": await db.inquiries.count_documents({}),
    }

@api.get("/admin/dealers")
async def admin_dealers(status: Optional[str] = None, _: dict = Depends(require_admin)):
    q = {"role": "dealer"}
    if status:
        q['status'] = status
    cursor = db.users.find(q, {"_id": 0, "password_hash": 0}).sort("created_at", -1)
    return {"items": await cursor.to_list(length=500)}

@api.patch("/admin/dealers/{dealer_id}/status")
async def admin_set_dealer_status(dealer_id: str, body: dict, _: dict = Depends(require_admin)):
    new_status = body.get('status')
    if new_status not in ('approved', 'pending', 'rejected', 'suspended'):
        raise HTTPException(status_code=400, detail="Ungültiger Status")
    r = await db.users.update_one({"id": dealer_id, "role": "dealer"}, {"$set": {"status": new_status, "updated_at": now_iso()}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Händler nicht gefunden")
    # If suspended/rejected — deactivate vehicles
    if new_status in ('rejected', 'suspended'):
        await db.vehicles.update_many({"dealer_id": dealer_id}, {"$set": {"status": "deactivated"}})
    return {"ok": True, "status": new_status}

@api.get("/admin/vehicles")
async def admin_vehicles(status: Optional[str] = None, _: dict = Depends(require_admin)):
    q = {}
    if status:
        q['status'] = status
    cursor = db.vehicles.find(q, {"_id": 0}).sort("created_at", -1)
    return {"items": await cursor.to_list(length=1000)}

@api.patch("/admin/vehicles/{vehicle_id}/status")
async def admin_set_vehicle_status(vehicle_id: str, body: dict, _: dict = Depends(require_admin)):
    new_status = body.get('status')
    if new_status not in ('published', 'deactivated', 'draft'):
        raise HTTPException(status_code=400, detail="Ungültiger Status")
    r = await db.vehicles.update_one({"id": vehicle_id}, {"$set": {"status": new_status, "updated_at": now_iso()}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    return {"ok": True, "status": new_status}


@api.get("/")
async def root():
    return {"message": "Auto-Marktplatz API", "ok": True}


app.include_router(api)


# -------- Startup --------
async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Administrator",
            "role": "admin",
            "status": "approved",
            "created_at": now_iso(),
        })
        logger.info(f"Admin geseedet: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing.get('password_hash', '')):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin", "status": "approved"}})
        logger.info("Admin Passwort aktualisiert")

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.vehicles.create_index("id", unique=True)
    await db.vehicles.create_index("dealer_id")
    await db.vehicles.create_index("status")
    await db.inquiries.create_index("dealer_id")
    await db.inquiries.create_index("vehicle_id")
    await db.files.create_index("storage_path")
    await seed_admin()
    try:
        init_storage()
        logger.info("Object Storage initialisiert")
    except Exception as e:
        logger.warning(f"Storage init Warnung: {e}")

@app.on_event("shutdown")
async def shutdown():
    client.close()
