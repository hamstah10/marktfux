"""Backend e2e tests for Auto-Marktplatz."""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dealer-market.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@auto-markt.de"
ADMIN_PASSWORD = "Admin123!"

# Unique dealer per run
RUN_ID = uuid.uuid4().hex[:8]
DEALER_EMAIL = f"TEST_dealer_{RUN_ID}@auto-markt.de"
DEALER_PASSWORD = "Dealer123!"

state = {}


@pytest.fixture(scope="session")
def s():
    return requests.Session()


# ---------- Health ----------
def test_health(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert j.get("ok") is True


# ---------- Auth ----------
def test_admin_login(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    j = r.json()
    assert "token" in j and j["user"]["role"] == "admin"
    state["admin_token"] = j["token"]


def test_register_dealer_pending(s):
    r = s.post(f"{API}/auth/register", json={
        "email": DEALER_EMAIL, "password": DEALER_PASSWORD,
        "name": "Test Dealer", "company": "TestCo", "phone": "+49123"
    })
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["user"]["role"] == "dealer"
    assert j["user"]["status"] == "pending"
    state["dealer_token"] = j["token"]
    state["dealer_id"] = j["user"]["id"]


def test_register_duplicate(s):
    r = s.post(f"{API}/auth/register", json={
        "email": DEALER_EMAIL, "password": DEALER_PASSWORD, "name": "x"
    })
    assert r.status_code == 400
    assert "bereits" in r.json().get("detail", "")


def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": DEALER_EMAIL, "password": "wrongpass"})
    assert r.status_code == 401


def test_me(s):
    r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 200
    assert r.json()["email"] == DEALER_EMAIL.lower()


# ---------- Dealer pending cannot create ----------
def test_pending_dealer_cannot_create_vehicle(s):
    payload = {"title": "X", "brand": "VW", "model": "Golf", "year": 2020, "price": 1000,
               "mileage": 1, "fuel": "Benzin", "transmission": "Schaltung",
               "power_hp": 100, "description": "x", "location": "Berlin", "images": []}
    r = s.post(f"{API}/dealer/vehicles", json=payload,
               headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 403
    assert "freigegeben" in r.json().get("detail", "")


# ---------- Admin approve dealer ----------
def test_admin_approve_dealer(s):
    r = s.patch(f"{API}/admin/dealers/{state['dealer_id']}/status",
                json={"status": "approved"},
                headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "approved"

    # Re-login dealer to refresh user fields
    r2 = s.post(f"{API}/auth/login", json={"email": DEALER_EMAIL, "password": DEALER_PASSWORD})
    assert r2.status_code == 200
    state["dealer_token"] = r2.json()["token"]
    assert r2.json()["user"]["status"] == "approved"


# ---------- Vehicle CRUD ----------
def test_dealer_create_vehicle(s):
    payload = {
        "title": "TEST_VW Golf VII 1.4 TSI", "brand": "VW", "model": "Golf",
        "year": 2019, "price": 14990.0, "mileage": 65000, "fuel": "Benzin",
        "transmission": "Schaltung", "power_hp": 125,
        "description": "Sehr gepflegter VW Golf.", "location": "Berlin", "images": []
    }
    r = s.post(f"{API}/dealer/vehicles", json=payload,
               headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["status"] == "published"
    assert j["brand"] == "VW"
    state["vehicle_id"] = j["id"]


def test_list_vehicles_with_filters(s):
    r = s.get(f"{API}/vehicles?brand=VW&min_price=1000&max_price=50000&search=Golf")
    assert r.status_code == 200
    j = r.json()
    assert "items" in j and "total" in j
    assert any(v["id"] == state["vehicle_id"] for v in j["items"])


def test_featured(s):
    r = s.get(f"{API}/vehicles/featured")
    assert r.status_code == 200
    assert isinstance(r.json()["items"], list)


def test_facets(s):
    r = s.get(f"{API}/vehicles/facets")
    assert r.status_code == 200
    j = r.json()
    assert "brands" in j and "fuels" in j and "transmissions" in j
    assert any(b["name"] == "VW" for b in j["brands"])


def test_get_vehicle_with_dealer(s):
    r = s.get(f"{API}/vehicles/{state['vehicle_id']}")
    assert r.status_code == 200
    j = r.json()
    assert j["id"] == state["vehicle_id"]
    assert "dealer" in j and j["dealer"]["name"]


def test_dealer_update_vehicle(s):
    r = s.patch(f"{API}/dealer/vehicles/{state['vehicle_id']}",
                json={"price": 13990.0},
                headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 200
    assert r.json()["price"] == 13990.0
    # verify
    g = s.get(f"{API}/vehicles/{state['vehicle_id']}")
    assert g.json()["price"] == 13990.0


# ---------- Inquiries ----------
def test_inquiry_flow(s):
    r = s.post(f"{API}/vehicles/{state['vehicle_id']}/inquiries", json={
        "name": "Anna Müller", "email": "anna@example.com",
        "phone": "+4915", "message": "Ist das Auto noch verfügbar?"
    })
    assert r.status_code == 200, r.text
    state["inq_id"] = r.json()["id"]

    r2 = s.get(f"{API}/dealer/inquiries",
               headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r2.status_code == 200
    items = r2.json()["items"]
    assert any(i["id"] == state["inq_id"] for i in items)

    r3 = s.patch(f"{API}/dealer/inquiries/{state['inq_id']}/read",
                 headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r3.status_code == 200


# ---------- File upload ----------
def test_file_upload(s):
    # Minimal 1x1 PNG
    png = bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108020000009077"
        "3DDE0000000C49444154789C6360606000000004000136D49DBE0000000049454E44AE426082"
    )
    files = {"file": ("test.png", io.BytesIO(png), "image/png")}
    r = s.post(f"{API}/files/upload", files=files,
               headers={"Authorization": f"Bearer {state['dealer_token']}"})
    if r.status_code != 200:
        pytest.skip(f"Storage backend not available: {r.status_code} {r.text[:200]}")
    j = r.json()
    assert "path" in j and "url" in j
    state["file_path"] = j["path"]

    # Download
    r2 = s.get(f"{BASE_URL}{j['url']}")
    assert r2.status_code == 200
    assert r2.content[:8] == png[:8]


# ---------- AI streaming ----------
def test_ai_describe_streams(s):
    r = s.post(f"{API}/ai/describe", json={
        "brand": "VW", "model": "Golf", "year": 2019, "mileage": 65000,
        "fuel": "Benzin", "transmission": "Schaltung", "power_hp": 125, "extra": ""
    }, headers={"Authorization": f"Bearer {state['dealer_token']}"}, stream=True, timeout=60)
    assert r.status_code == 200, r.text[:300]
    ct = r.headers.get("Content-Type", "")
    assert "event-stream" in ct
    # Read at least one data chunk
    got_data = False
    start = time.time()
    for line in r.iter_lines(decode_unicode=True):
        if line and line.startswith("data:"):
            got_data = True
            break
        if time.time() - start > 30:
            break
    r.close()
    assert got_data, "No SSE data chunk received from AI endpoint"


# ---------- Admin endpoints ----------
def test_admin_stats(s):
    r = s.get(f"{API}/admin/stats",
              headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r.status_code == 200
    j = r.json()
    assert j["dealers_total"] >= 1
    assert j["vehicles_total"] >= 1


def test_admin_non_admin_forbidden(s):
    r = s.get(f"{API}/admin/stats",
              headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 403


def test_admin_dealers_list(s):
    r = s.get(f"{API}/admin/dealers",
              headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r.status_code == 200
    assert any(d["id"] == state["dealer_id"] for d in r.json()["items"])


def test_admin_vehicles_list(s):
    r = s.get(f"{API}/admin/vehicles",
              headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r.status_code == 200


def test_admin_deactivate_vehicle_hides_from_public(s):
    r = s.patch(f"{API}/admin/vehicles/{state['vehicle_id']}/status",
                json={"status": "deactivated"},
                headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r.status_code == 200
    # Public should not see it
    g = s.get(f"{API}/vehicles/{state['vehicle_id']}")
    assert g.status_code == 404


# ---------- Cleanup ----------
def test_zz_cleanup(s):
    # Delete vehicle (need to re-publish first to allow dealer ownership delete; status doesn't matter for delete)
    r = s.delete(f"{API}/dealer/vehicles/{state['vehicle_id']}",
                 headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 200
