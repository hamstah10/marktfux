"""One-off migration from MongoDB → SQLite.
Reads from the existing MongoDB instance and inserts into the SQLite DB used
by the new SQLite-backed server.

Usage:
    cd /app/backend
    python migrate_mongo_to_sqlite.py           # reads from MONGO_URL/DB_NAME env
    python migrate_mongo_to_sqlite.py --src DB  # override source DB name
"""
import os
import sys
import json
import asyncio
import argparse
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from motor.motor_asyncio import AsyncIOMotorClient
from db import get_db, init_schema, execute, encode_json, fetchone


async def migrate(src_db_name: str | None):
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL nicht gesetzt — nichts zu migrieren.")
        return

    src_name = src_db_name or os.environ.get("DB_NAME", "test_database")
    print(f"▶ Lese aus MongoDB '{mongo_url}' / DB '{src_name}'")
    client = AsyncIOMotorClient(mongo_url)
    src = client[src_name]

    await init_schema()

    # USERS
    n = 0
    async for u in src.users.find():
        existing = await fetchone("SELECT id FROM users WHERE email = ?", (u.get("email", "").lower(),))
        if existing:
            continue
        await execute(
            """INSERT INTO users (id, email, password_hash, name, company, phone, role, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (u.get("id") or str(u["_id"]), (u.get("email") or "").lower(),
             u.get("password_hash", ""), u.get("name") or "",
             u.get("company") or "", u.get("phone") or "",
             u.get("role") or "dealer", u.get("status") or "approved",
             u.get("created_at") or "", u.get("updated_at") or "")
        )
        n += 1
    print(f"  users      : {n}")

    # VEHICLES
    n = 0
    async for v in src.vehicles.find():
        await execute(
            """INSERT OR IGNORE INTO vehicles
               (id, dealer_id, dealer_name, title, brand, model, year, price, mileage,
                fuel, transmission, power_hp, description, location, images_json, status,
                views, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (v.get("id") or str(v["_id"]), v.get("dealer_id"), v.get("dealer_name"),
             v.get("title"), v.get("brand"), v.get("model"),
             int(v.get("year") or 0), float(v.get("price") or 0),
             int(v.get("mileage") or 0), v.get("fuel"), v.get("transmission"),
             int(v.get("power_hp") or 0), v.get("description"), v.get("location"),
             encode_json(v.get("images") or []), v.get("status") or "published",
             int(v.get("views") or 0), v.get("created_at") or "", v.get("updated_at") or "")
        )
        n += 1
    print(f"  vehicles   : {n}")

    # INQUIRIES
    n = 0
    async for i in src.inquiries.find():
        await execute(
            """INSERT OR IGNORE INTO inquiries
               (id, vehicle_id, vehicle_title, dealer_id, name, email, phone, message, read, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (i.get("id") or str(i["_id"]), i.get("vehicle_id"), i.get("vehicle_title"),
             i.get("dealer_id"), i.get("name"), i.get("email"),
             i.get("phone") or "", i.get("message") or "",
             1 if i.get("read") else 0, i.get("created_at") or "")
        )
        n += 1
    print(f"  inquiries  : {n}")

    # FILES
    n = 0
    async for f in src.files.find():
        await execute(
            """INSERT OR IGNORE INTO files
               (id, storage_path, original_filename, content_type, size, owner_id, is_deleted, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (f.get("id") or str(f["_id"]), f.get("storage_path"), f.get("original_filename"),
             f.get("content_type"), int(f.get("size") or 0), f.get("owner_id"),
             1 if f.get("is_deleted") else 0, f.get("created_at") or "")
        )
        n += 1
    print(f"  files      : {n}")

    # REVIEWS
    n = 0
    async for r in src.reviews.find():
        await execute(
            """INSERT OR IGNORE INTO reviews
               (id, dealer_id, rating, name, comment, approved, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (r.get("id") or str(r["_id"]), r.get("dealer_id"),
             int(r.get("rating") or 0), r.get("name"), r.get("comment"),
             1 if r.get("approved", True) else 0, r.get("created_at") or "")
        )
        n += 1
    print(f"  reviews    : {n}")

    print("✅ Migration abgeschlossen.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--src", help="Name der Quell-Datenbank in MongoDB", default=None)
    args = p.parse_args()
    asyncio.run(migrate(args.src))
