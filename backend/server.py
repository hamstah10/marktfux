from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import requests
import bcrypt
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

from db import get_db, init_schema, fetchone, fetchall, execute, scalar, encode_json, close_db

# -------- ENV --------
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@marktfux.de').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin123!')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
APP_NAME = os.environ.get('APP_NAME', 'marktfux')
DEALER_AUTO_APPROVE = os.environ.get('DEALER_AUTO_APPROVE', 'false').lower() == 'true'

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
storage_key: Optional[str] = None

# -------- APP --------
app = FastAPI(title="marktFUX API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("marktfux")


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
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def sanitize_user(u: dict | None) -> dict | None:
    if not u:
        return u
    u = dict(u)
    u.pop('password_hash', None)
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
        user = await fetchone("SELECT * FROM users WHERE id = ?", (payload['sub'],))
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
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key}, timeout=60)
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
    fuel: str
    transmission: str
    power_hp: int
    description: str
    location: str
    images: List[str] = []

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
    status: Optional[str] = None

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

class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    name: str = Field(min_length=2, max_length=80)
    comment: str = Field(min_length=10, max_length=2000)


# -------- Auth --------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower()
    existing = await fetchone("SELECT id FROM users WHERE email = ?", (email,))
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    user_id = str(uuid.uuid4())
    status = "approved" if DEALER_AUTO_APPROVE else "pending"
    created = now_iso()
    await execute(
        """INSERT INTO users (id, email, password_hash, name, company, phone, role, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'dealer', ?, ?)""",
        (user_id, email, hash_password(payload.password), payload.name,
         payload.company or "", payload.phone or "", status, created)
    )
    user = await fetchone("SELECT * FROM users WHERE id = ?", (user_id,))
    token = create_access_token(user_id, email, "dealer")
    return {"token": token, "user": sanitize_user(user)}

@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await fetchone("SELECT * FROM users WHERE email = ?", (email,))
    if not user or not verify_password(payload.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    token = create_access_token(user['id'], user['email'], user['role'])
    return {"token": token, "user": sanitize_user(user)}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# -------- Public Vehicles --------
def _vehicle_filters(params: dict):
    where = ["status = 'published'"]
    args: list = []
    if params.get('brand'):
        where.append("brand = ?"); args.append(params['brand'])
    if params.get('fuel'):
        where.append("fuel = ?"); args.append(params['fuel'])
    if params.get('transmission'):
        where.append("transmission = ?"); args.append(params['transmission'])
    if params.get('location'):
        where.append("location LIKE ? COLLATE NOCASE"); args.append(f"%{params['location']}%")
    if params.get('min_price') is not None:
        where.append("price >= ?"); args.append(float(params['min_price']))
    if params.get('max_price') is not None:
        where.append("price <= ?"); args.append(float(params['max_price']))
    if params.get('min_year') is not None:
        where.append("year >= ?"); args.append(int(params['min_year']))
    if params.get('max_year') is not None:
        where.append("year <= ?"); args.append(int(params['max_year']))
    if params.get('max_mileage') is not None:
        where.append("mileage <= ?"); args.append(int(params['max_mileage']))
    if params.get('search'):
        s = f"%{params['search']}%"
        where.append("(title LIKE ? OR brand LIKE ? OR model LIKE ? OR description LIKE ?) COLLATE NOCASE")
        args.extend([s, s, s, s])
    return " AND ".join(where), args

@api.get("/vehicles")
async def list_vehicles(
    brand: Optional[str] = None, fuel: Optional[str] = None, transmission: Optional[str] = None,
    location: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None,
    min_year: Optional[int] = None, max_year: Optional[int] = None, max_mileage: Optional[int] = None,
    search: Optional[str] = None, sort: Optional[str] = "newest", skip: int = 0, limit: int = 24,
):
    sort_map = {"price_asc": "price ASC", "price_desc": "price DESC",
                "year_desc": "year DESC", "year_asc": "year ASC",
                "mileage_asc": "mileage ASC", "newest": "created_at DESC"}
    order = sort_map.get(sort or "newest", "created_at DESC")
    where_clause, args = _vehicle_filters({
        "brand": brand, "fuel": fuel, "transmission": transmission, "location": location,
        "min_price": min_price, "max_price": max_price, "min_year": min_year,
        "max_year": max_year, "max_mileage": max_mileage, "search": search,
    })
    total = await scalar(f"SELECT COUNT(*) FROM vehicles WHERE {where_clause}", tuple(args))
    items = await fetchall(
        f"SELECT * FROM vehicles WHERE {where_clause} ORDER BY {order} LIMIT ? OFFSET ?",
        tuple(args + [limit, skip])
    )
    return {"items": items, "total": int(total or 0)}

@api.get("/vehicles/featured")
async def featured_vehicles():
    items = await fetchall("SELECT * FROM vehicles WHERE status = 'published' ORDER BY created_at DESC LIMIT 6")
    return {"items": items}

@api.get("/vehicles/facets")
async def facets():
    brands = await fetchall(
        "SELECT brand AS name, COUNT(*) AS count FROM vehicles WHERE status='published' AND brand IS NOT NULL AND brand != '' GROUP BY brand ORDER BY brand"
    )
    return {
        "brands": brands,
        "fuels": ["Benzin", "Diesel", "Elektro", "Hybrid", "LPG/Autogas"],
        "transmissions": ["Schaltung", "Automatik"],
    }

@api.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    v = await fetchone("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
    if not v or v.get('status') != 'published':
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    try:
        await execute("UPDATE vehicles SET views = views + 1 WHERE id = ?", (vehicle_id,))
        v['views'] = (v.get('views') or 0) + 1
    except Exception:
        pass
    dealer = await fetchone("SELECT id, name, company, phone FROM users WHERE id = ?", (v.get('dealer_id') or "",))
    if dealer:
        v['dealer'] = {**dealer, "location": v.get('location')}
    return v

@api.post("/vehicles/by-ids")
async def vehicles_by_ids(body: dict):
    ids = (body.get("ids") or [])[:200]
    if not isinstance(ids, list) or not ids:
        return {"items": []}
    placeholders = ",".join("?" * len(ids))
    items = await fetchall(
        f"SELECT * FROM vehicles WHERE id IN ({placeholders}) AND status='published'",
        tuple(ids)
    )
    return {"items": items}


# -------- Public Dealer Profile + Reviews --------
async def _dealer_rating(dealer_id: str) -> dict:
    row = await fetchone(
        "SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE dealer_id = ? AND approved = 1",
        (dealer_id,)
    )
    if not row or not row.get('count'):
        return {"avg": 0.0, "count": 0}
    return {"avg": round(float(row['avg'] or 0), 1), "count": int(row['count'])}

@api.get("/dealers/{dealer_id}")
async def public_dealer(dealer_id: str):
    d = await fetchone(
        "SELECT id, email, name, company, phone, created_at FROM users WHERE id = ? AND role = 'dealer' AND status = 'approved'",
        (dealer_id,)
    )
    if not d:
        raise HTTPException(status_code=404, detail="Händler nicht gefunden")
    vehicle_count = await scalar(
        "SELECT COUNT(*) FROM vehicles WHERE dealer_id = ? AND status='published'", (dealer_id,)
    )
    rating = await _dealer_rating(dealer_id)
    return {**d, "vehicle_count": int(vehicle_count or 0),
            "rating_avg": rating["avg"], "rating_count": rating["count"]}

@api.get("/dealers/{dealer_id}/vehicles")
async def public_dealer_vehicles(dealer_id: str):
    items = await fetchall(
        "SELECT * FROM vehicles WHERE dealer_id = ? AND status = 'published' ORDER BY created_at DESC",
        (dealer_id,)
    )
    return {"items": items}

@api.get("/dealers/{dealer_id}/reviews")
async def public_dealer_reviews(dealer_id: str):
    items = await fetchall(
        "SELECT * FROM reviews WHERE dealer_id = ? AND approved = 1 ORDER BY created_at DESC",
        (dealer_id,)
    )
    return {"items": items}

@api.post("/dealers/{dealer_id}/reviews")
async def post_dealer_review(dealer_id: str, payload: ReviewIn):
    d = await fetchone("SELECT id FROM users WHERE id = ? AND role='dealer'", (dealer_id,))
    if not d:
        raise HTTPException(status_code=404, detail="Händler nicht gefunden")
    rid = str(uuid.uuid4())
    await execute(
        "INSERT INTO reviews (id, dealer_id, rating, name, comment, approved, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
        (rid, dealer_id, payload.rating, payload.name.strip(), payload.comment.strip(), now_iso())
    )
    return await fetchone("SELECT * FROM reviews WHERE id = ?", (rid,))


# -------- Dealer Vehicle CRUD --------
@api.get("/dealer/vehicles")
async def dealer_list(user: dict = Depends(require_dealer)):
    items = await fetchall(
        "SELECT * FROM vehicles WHERE dealer_id = ? ORDER BY created_at DESC", (user['id'],)
    )
    return {"items": items}

@api.get("/dealer/vehicles/{vehicle_id}")
async def dealer_get(vehicle_id: str, user: dict = Depends(require_dealer)):
    v = await fetchone("SELECT * FROM vehicles WHERE id = ? AND dealer_id = ?", (vehicle_id, user['id']))
    if not v:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return v

@api.post("/dealer/vehicles")
async def dealer_create(payload: VehicleIn, user: dict = Depends(require_dealer)):
    vid = str(uuid.uuid4())
    now = now_iso()
    dealer_name = user.get('company') or user.get('name')
    await execute(
        """INSERT INTO vehicles
           (id, dealer_id, dealer_name, title, brand, model, year, price, mileage,
            fuel, transmission, power_hp, description, location, images_json, status,
            views, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?)""",
        (vid, user['id'], dealer_name, payload.title, payload.brand, payload.model,
         payload.year, payload.price, payload.mileage, payload.fuel, payload.transmission,
         payload.power_hp, payload.description, payload.location,
         encode_json(payload.images), now, now)
    )
    return await fetchone("SELECT * FROM vehicles WHERE id = ?", (vid,))

@api.patch("/dealer/vehicles/{vehicle_id}")
async def dealer_update(vehicle_id: str, payload: VehicleUpdate, user: dict = Depends(require_dealer)):
    v = await fetchone("SELECT id FROM vehicles WHERE id = ? AND dealer_id = ?", (vehicle_id, user['id']))
    if not v:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    data = payload.model_dump(exclude_none=True)
    if not data:
        return await fetchone("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
    sets, vals = [], []
    for k, val in data.items():
        if k == "images":
            sets.append("images_json = ?"); vals.append(encode_json(val))
        else:
            sets.append(f"{k} = ?"); vals.append(val)
    sets.append("updated_at = ?"); vals.append(now_iso())
    vals.append(vehicle_id)
    await execute(f"UPDATE vehicles SET {', '.join(sets)} WHERE id = ?", tuple(vals))
    return await fetchone("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))

@api.delete("/dealer/vehicles/{vehicle_id}")
async def dealer_delete(vehicle_id: str, user: dict = Depends(require_dealer)):
    rc = await execute("DELETE FROM vehicles WHERE id = ? AND dealer_id = ?", (vehicle_id, user['id']))
    if rc == 0:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return {"ok": True}

@api.get("/dealer/stats")
async def dealer_stats(user: dict = Depends(require_dealer)):
    return {
        "total_listings": int(await scalar("SELECT COUNT(*) FROM vehicles WHERE dealer_id = ?", (user['id'],)) or 0),
        "published_listings": int(await scalar("SELECT COUNT(*) FROM vehicles WHERE dealer_id = ? AND status='published'", (user['id'],)) or 0),
        "total_inquiries": int(await scalar("SELECT COUNT(*) FROM inquiries WHERE dealer_id = ?", (user['id'],)) or 0),
        "unread_inquiries": int(await scalar("SELECT COUNT(*) FROM inquiries WHERE dealer_id = ? AND read = 0", (user['id'],)) or 0),
    }

@api.get("/dealer/analytics")
async def dealer_analytics(user: dict = Depends(require_dealer)):
    vehicles = await fetchall("SELECT * FROM vehicles WHERE dealer_id = ? ORDER BY created_at DESC", (user['id'],))
    inq_rows = await fetchall(
        "SELECT vehicle_id, COUNT(*) AS c FROM inquiries WHERE dealer_id = ? GROUP BY vehicle_id", (user['id'],)
    )
    inq_map = {r["vehicle_id"]: r["c"] for r in inq_rows}
    per_vehicle = []
    total_views = 0
    total_leads = 0
    for v in vehicles:
        views = int(v.get("views") or 0)
        leads = int(inq_map.get(v["id"], 0))
        conv = round((leads / views * 100), 1) if views > 0 else 0.0
        per_vehicle.append({
            "id": v["id"], "title": v["title"], "brand": v.get("brand"), "model": v.get("model"),
            "status": v.get("status"), "image": (v.get("images") or [None])[0],
            "views": views, "leads": leads, "conversion": conv,
        })
        total_views += views
        total_leads += leads
    return {
        "total_views": total_views, "total_leads": total_leads,
        "overall_conversion": round((total_leads / total_views * 100), 1) if total_views else 0.0,
        "active_listings": sum(1 for v in vehicles if v.get("status") == "published"),
        "per_vehicle": per_vehicle,
        "top_views": sorted(per_vehicle, key=lambda x: x["views"], reverse=True)[:5],
        "top_leads": sorted(per_vehicle, key=lambda x: x["leads"], reverse=True)[:5],
    }


# -------- Inquiries --------
@api.post("/vehicles/{vehicle_id}/inquiries")
async def create_inquiry(vehicle_id: str, payload: InquiryIn):
    v = await fetchone("SELECT id, title, dealer_id FROM vehicles WHERE id = ?", (vehicle_id,))
    if not v:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    inq_id = str(uuid.uuid4())
    await execute(
        """INSERT INTO inquiries (id, vehicle_id, vehicle_title, dealer_id, name, email, phone, message, read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)""",
        (inq_id, vehicle_id, v['title'], v.get('dealer_id'), payload.name, payload.email,
         payload.phone or "", payload.message, now_iso())
    )
    return await fetchone("SELECT * FROM inquiries WHERE id = ?", (inq_id,))

@api.get("/dealer/inquiries")
async def dealer_inquiries(user: dict = Depends(require_dealer)):
    items = await fetchall("SELECT * FROM inquiries WHERE dealer_id = ? ORDER BY created_at DESC", (user['id'],))
    return {"items": items}

@api.patch("/dealer/inquiries/{inq_id}/read")
async def mark_read(inq_id: str, user: dict = Depends(require_dealer)):
    rc = await execute("UPDATE inquiries SET read = 1 WHERE id = ? AND dealer_id = ?", (inq_id, user['id']))
    if rc == 0:
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
    await execute(
        """INSERT INTO files (id, storage_path, original_filename, content_type, size, owner_id, is_deleted, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)""",
        (str(uuid.uuid4()), result["path"], file.filename, file.content_type,
         result.get("size", len(data)), user['id'], now_iso())
    )
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api.get("/files/{path:path}")
async def download_file(path: str):
    rec = await fetchone("SELECT content_type FROM files WHERE storage_path = ? AND is_deleted = 0", (path,))
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

    system = ("Du bist ein erfahrener deutscher Autohändler-Texter. "
              "Schreibe einen professionellen, vertrauensvollen Fahrzeug-Inseratstext auf Deutsch. "
              "Strukturiere in 3 kurze Absätze: 1) Übersicht & Highlights, 2) Technische Details, 3) Empfehlung & Call-to-Action. "
              "Keine Übertreibungen, keine Garantien, keine Preisangaben. 120-180 Wörter.")
    prompt = (f"Erstelle einen Inseratstext für: {payload.brand} {payload.model}, "
              f"Baujahr {payload.year}, {payload.mileage} km, "
              f"Kraftstoff: {payload.fuel}, Getriebe: {payload.transmission}, "
              f"Leistung: {payload.power_hp} PS. "
              f"Zusatzinfos vom Händler: {payload.extra or 'keine'}.")

    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"describe-{user['id']}-{uuid.uuid4()}",
                   system_message=system).with_model("openai", "gpt-5.2")

    async def event_gen():
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
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
        "dealers_total":      int(await scalar("SELECT COUNT(*) FROM users WHERE role='dealer'") or 0),
        "dealers_pending":    int(await scalar("SELECT COUNT(*) FROM users WHERE role='dealer' AND status='pending'") or 0),
        "dealers_approved":   int(await scalar("SELECT COUNT(*) FROM users WHERE role='dealer' AND status='approved'") or 0),
        "vehicles_total":     int(await scalar("SELECT COUNT(*) FROM vehicles") or 0),
        "vehicles_published": int(await scalar("SELECT COUNT(*) FROM vehicles WHERE status='published'") or 0),
        "vehicles_deactivated": int(await scalar("SELECT COUNT(*) FROM vehicles WHERE status='deactivated'") or 0),
        "inquiries_total":    int(await scalar("SELECT COUNT(*) FROM inquiries") or 0),
    }

@api.get("/admin/dealers")
async def admin_dealers(status: Optional[str] = None, _: dict = Depends(require_admin)):
    if status:
        items = await fetchall(
            "SELECT id, email, name, company, phone, role, status, created_at, updated_at FROM users WHERE role='dealer' AND status=? ORDER BY created_at DESC",
            (status,)
        )
    else:
        items = await fetchall(
            "SELECT id, email, name, company, phone, role, status, created_at, updated_at FROM users WHERE role='dealer' ORDER BY created_at DESC"
        )
    return {"items": items}

@api.get("/admin/dealers/{dealer_id}")
async def admin_dealer_detail(dealer_id: str, _: dict = Depends(require_admin)):
    d = await fetchone(
        "SELECT id, email, name, company, phone, role, status, created_at, updated_at FROM users WHERE id = ? AND role='dealer'",
        (dealer_id,)
    )
    if not d:
        raise HTTPException(status_code=404, detail="Händler nicht gefunden")
    vehicles = await fetchall("SELECT * FROM vehicles WHERE dealer_id = ? ORDER BY created_at DESC", (dealer_id,))
    inquiries_total = int(await scalar("SELECT COUNT(*) FROM inquiries WHERE dealer_id = ?", (dealer_id,)) or 0)
    inquiries_unread = int(await scalar("SELECT COUNT(*) FROM inquiries WHERE dealer_id = ? AND read = 0", (dealer_id,)) or 0)
    reviews = await fetchall("SELECT * FROM reviews WHERE dealer_id = ? ORDER BY created_at DESC", (dealer_id,))
    rating = await _dealer_rating(dealer_id)
    total_views = sum(int(v.get("views") or 0) for v in vehicles)
    return {
        "dealer": d,
        "stats": {
            "vehicles_total": len(vehicles),
            "vehicles_published": sum(1 for v in vehicles if v.get("status") == "published"),
            "vehicles_deactivated": sum(1 for v in vehicles if v.get("status") == "deactivated"),
            "inquiries_total": inquiries_total, "inquiries_unread": inquiries_unread,
            "rating_avg": rating["avg"], "rating_count": rating["count"],
            "total_views": total_views,
        },
        "vehicles": vehicles, "reviews": reviews,
    }

@api.patch("/admin/dealers/{dealer_id}/status")
async def admin_set_dealer_status(dealer_id: str, body: dict, _: dict = Depends(require_admin)):
    new_status = body.get('status')
    if new_status not in ('approved', 'pending', 'rejected', 'suspended'):
        raise HTTPException(status_code=400, detail="Ungültiger Status")
    rc = await execute(
        "UPDATE users SET status = ?, updated_at = ? WHERE id = ? AND role='dealer'",
        (new_status, now_iso(), dealer_id)
    )
    if rc == 0:
        raise HTTPException(status_code=404, detail="Händler nicht gefunden")
    if new_status in ('rejected', 'suspended'):
        await execute("UPDATE vehicles SET status='deactivated' WHERE dealer_id = ?", (dealer_id,))
    return {"ok": True, "status": new_status}

@api.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, _: dict = Depends(require_admin)):
    rc = await execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    if rc == 0:
        raise HTTPException(status_code=404, detail="Bewertung nicht gefunden")
    return {"ok": True}

@api.get("/admin/vehicles")
async def admin_vehicles(status: Optional[str] = None, _: dict = Depends(require_admin)):
    if status:
        items = await fetchall("SELECT * FROM vehicles WHERE status = ? ORDER BY created_at DESC", (status,))
    else:
        items = await fetchall("SELECT * FROM vehicles ORDER BY created_at DESC")
    return {"items": items}

@api.get("/admin/vehicles/{vehicle_id}")
async def admin_vehicle_detail(vehicle_id: str, _: dict = Depends(require_admin)):
    v = await fetchone("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
    if not v:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    dealer = None
    if v.get("dealer_id"):
        dealer = await fetchone(
            "SELECT id, email, name, company, phone, role, status, created_at FROM users WHERE id = ?",
            (v["dealer_id"],)
        )
    inquiries = await fetchall("SELECT * FROM inquiries WHERE vehicle_id = ? ORDER BY created_at DESC", (vehicle_id,))
    return {"vehicle": v, "dealer": dealer, "inquiries": inquiries}

@api.patch("/admin/vehicles/{vehicle_id}/status")
async def admin_set_vehicle_status(vehicle_id: str, body: dict, _: dict = Depends(require_admin)):
    new_status = body.get('status')
    if new_status not in ('published', 'deactivated', 'draft'):
        raise HTTPException(status_code=400, detail="Ungültiger Status")
    rc = await execute(
        "UPDATE vehicles SET status = ?, updated_at = ? WHERE id = ?",
        (new_status, now_iso(), vehicle_id)
    )
    if rc == 0:
        raise HTTPException(status_code=404, detail="Fahrzeug nicht gefunden")
    return {"ok": True, "status": new_status}


@api.get("/")
async def root():
    return {"message": "marktFUX API", "ok": True, "db": "sqlite"}


app.include_router(api)


# -------- Startup --------
async def seed_admin():
    existing = await fetchone("SELECT id, password_hash FROM users WHERE email = ?", (ADMIN_EMAIL,))
    if not existing:
        await execute(
            """INSERT INTO users (id, email, password_hash, name, role, status, created_at)
               VALUES (?, ?, ?, 'Administrator', 'admin', 'approved', ?)""",
            (str(uuid.uuid4()), ADMIN_EMAIL, hash_password(ADMIN_PASSWORD), now_iso())
        )
        logger.info(f"Admin geseedet: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing.get('password_hash', '')):
        await execute(
            "UPDATE users SET password_hash = ?, role='admin', status='approved' WHERE email = ?",
            (hash_password(ADMIN_PASSWORD), ADMIN_EMAIL)
        )
        logger.info("Admin Passwort aktualisiert")

@app.on_event("startup")
async def startup():
    await init_schema()
    await seed_admin()
    try:
        init_storage()
        logger.info("Object Storage initialisiert")
    except Exception as e:
        logger.warning(f"Storage init Warnung: {e}")
    logger.info("marktFUX backend ready (SQLite)")

@app.on_event("shutdown")
async def shutdown():
    await close_db()
