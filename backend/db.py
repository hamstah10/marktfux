"""SQLite database layer for marktFUX.
Lightweight async wrapper around aiosqlite with dict-row helpers and
schema initialisation. Replaces the previous MongoDB layer.
"""
import os
import json
import aiosqlite
from pathlib import Path

DB_PATH = os.environ.get("SQLITE_PATH") or str(Path(__file__).parent / "data" / "marktfux.db")
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

_conn: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _conn
    if _conn is None:
        _conn = await aiosqlite.connect(DB_PATH, isolation_level=None)  # autocommit
        _conn.row_factory = aiosqlite.Row
        await _conn.execute("PRAGMA journal_mode = WAL")
        await _conn.execute("PRAGMA foreign_keys = ON")
        await _conn.execute("PRAGMA synchronous = NORMAL")
    return _conn


async def close_db():
    global _conn
    if _conn is not None:
        await _conn.close()
        _conn = None


def row_to_dict(row: aiosqlite.Row | None) -> dict | None:
    if row is None:
        return None
    d = dict(row)
    # Decode JSON columns (anything ending in `_json`)
    for k in list(d.keys()):
        if k.endswith("_json") and d[k]:
            try:
                d[k[:-5]] = json.loads(d[k])
            except Exception:
                d[k[:-5]] = []
            d.pop(k)
        elif k.endswith("_json"):
            d[k[:-5]] = []
            d.pop(k)
    # cast booleans stored as INTEGER
    for k in ("read", "approved", "is_deleted"):
        if k in d:
            d[k] = bool(d[k])
    return d


async def fetchone(query: str, params: tuple = ()) -> dict | None:
    db = await get_db()
    async with db.execute(query, params) as cur:
        row = await cur.fetchone()
    return row_to_dict(row)


async def fetchall(query: str, params: tuple = ()) -> list[dict]:
    db = await get_db()
    async with db.execute(query, params) as cur:
        rows = await cur.fetchall()
    return [row_to_dict(r) for r in rows]


async def execute(query: str, params: tuple = ()) -> int:
    db = await get_db()
    cur = await db.execute(query, params)
    rc = cur.rowcount
    await cur.close()
    return rc


async def scalar(query: str, params: tuple = ()) -> int | float | str | None:
    db = await get_db()
    async with db.execute(query, params) as cur:
        row = await cur.fetchone()
    return row[0] if row else None


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  dealer_id TEXT,
  dealer_name TEXT,
  title TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  price REAL,
  mileage INTEGER,
  fuel TEXT,
  transmission TEXT,
  power_hp INTEGER,
  description TEXT,
  location TEXT,
  images_json TEXT DEFAULT '[]',
  status TEXT DEFAULT 'published',
  views INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer ON vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand  ON vehicles(brand);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT,
  vehicle_title TEXT,
  dealer_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_inq_dealer  ON inquiries(dealer_id);
CREATE INDEX IF NOT EXISTS idx_inq_vehicle ON inquiries(vehicle_id);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  storage_path TEXT UNIQUE,
  original_filename TEXT,
  content_type TEXT,
  size INTEGER,
  owner_id TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(storage_path);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  dealer_id TEXT,
  rating INTEGER,
  name TEXT,
  comment TEXT,
  approved INTEGER DEFAULT 1,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_dealer ON reviews(dealer_id);
"""


async def init_schema():
    db = await get_db()
    for stmt in SCHEMA.strip().split(";"):
        s = stmt.strip()
        if s:
            await db.execute(s)


def encode_json(value) -> str:
    return json.dumps(value or [], ensure_ascii=False)
