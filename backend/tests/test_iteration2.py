"""Iteration 2 tests: views increment, /vehicles/by-ids, /dealer/analytics."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@auto-markt.de"
ADMIN_PASSWORD = "Admin123!"
RUN_ID = uuid.uuid4().hex[:8]
DEALER_EMAIL = f"TEST_dealer2_{RUN_ID}@auto-markt.de"
DEALER_PASSWORD = "Dealer123!"

state = {}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def test_setup_admin_login(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    state["admin_token"] = r.json()["token"]


def test_setup_register_and_approve_dealer(s):
    r = s.post(f"{API}/auth/register", json={
        "email": DEALER_EMAIL, "password": DEALER_PASSWORD,
        "name": "It2 Dealer", "company": "It2Co"
    })
    assert r.status_code == 200, r.text
    state["dealer_id"] = r.json()["user"]["id"]

    # approve
    r2 = s.patch(f"{API}/admin/dealers/{state['dealer_id']}/status",
                 json={"status": "approved"},
                 headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r2.status_code == 200

    # re-login
    r3 = s.post(f"{API}/auth/login", json={"email": DEALER_EMAIL, "password": DEALER_PASSWORD})
    assert r3.status_code == 200
    state["dealer_token"] = r3.json()["token"]


def _create_vehicle(s, title):
    payload = {"title": title, "brand": "VW", "model": "Golf", "year": 2020, "price": 12000.0,
               "mileage": 50000, "fuel": "Benzin", "transmission": "Schaltung", "power_hp": 110,
               "description": "Test", "location": "Berlin", "images": []}
    r = s.post(f"{API}/dealer/vehicles", json=payload,
               headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 200, r.text
    return r.json()["id"]


def test_create_two_vehicles_for_analytics(s):
    state["v1"] = _create_vehicle(s, "TEST_It2_V1")
    state["v2"] = _create_vehicle(s, "TEST_It2_V2")
    state["v3_unpublished"] = _create_vehicle(s, "TEST_It2_V3")
    # deactivate v3 via dealer update
    rr = s.patch(f"{API}/dealer/vehicles/{state['v3_unpublished']}",
                 json={"status": "deactivated"},
                 headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert rr.status_code == 200


# ---- Views increment ----
def test_views_increment_on_get(s):
    r1 = s.get(f"{API}/vehicles/{state['v1']}")
    assert r1.status_code == 200
    v1_views = r1.json().get("views", 0)
    r2 = s.get(f"{API}/vehicles/{state['v1']}")
    assert r2.status_code == 200
    v2_views = r2.json().get("views", 0)
    assert v2_views == v1_views + 1, f"views did not increment: {v1_views} -> {v2_views}"


# ---- vehicles/by-ids ----
def test_by_ids_returns_published_only(s):
    r = s.post(f"{API}/vehicles/by-ids",
               json={"ids": [state["v1"], state["v2"], state["v3_unpublished"], "non-existent-id-xxx"]})
    assert r.status_code == 200
    j = r.json()
    assert "items" in j
    ids = [v["id"] for v in j["items"]]
    assert state["v1"] in ids
    assert state["v2"] in ids
    assert state["v3_unpublished"] not in ids
    assert "non-existent-id-xxx" not in ids
    assert len(j["items"]) == 2


def test_by_ids_empty_body(s):
    r = s.post(f"{API}/vehicles/by-ids", json={})
    assert r.status_code == 200
    assert r.json() == {"items": []}


def test_by_ids_empty_list(s):
    r = s.post(f"{API}/vehicles/by-ids", json={"ids": []})
    assert r.status_code == 200
    assert r.json() == {"items": []}


def test_by_ids_invalid_ids_type(s):
    r = s.post(f"{API}/vehicles/by-ids", json={"ids": "not-a-list"})
    assert r.status_code == 200
    assert r.json() == {"items": []}


# ---- Inquiry to drive leads ----
def test_create_inquiry_for_v2(s):
    r = s.post(f"{API}/vehicles/{state['v2']}/inquiries", json={
        "name": "Test Buyer", "email": "buy@example.com",
        "phone": "+49", "message": "interested"
    })
    assert r.status_code == 200


# ---- Dealer analytics ----
def test_dealer_analytics_shape(s):
    r = s.get(f"{API}/dealer/analytics",
              headers={"Authorization": f"Bearer {state['dealer_token']}"})
    assert r.status_code == 200, r.text
    j = r.json()
    for key in ["total_views", "total_leads", "overall_conversion",
                "active_listings", "per_vehicle", "top_views", "top_leads"]:
        assert key in j, f"missing key {key}"
    assert isinstance(j["per_vehicle"], list)
    assert isinstance(j["top_views"], list)
    assert isinstance(j["top_leads"], list)
    # active_listings = published only (2)
    assert j["active_listings"] == 2

    # v1 had 2 views; v2 should have at least 1 lead
    pv_map = {v["id"]: v for v in j["per_vehicle"]}
    assert state["v1"] in pv_map
    assert pv_map[state["v1"]]["views"] >= 2
    assert pv_map[state["v2"]]["leads"] >= 1
    # conversion field is numeric
    assert isinstance(pv_map[state["v1"]]["conversion"], (int, float))
    # each per_vehicle entry has id, title, views, leads, conversion
    for v in j["per_vehicle"]:
        for k in ["id", "title", "views", "leads", "conversion"]:
            assert k in v


def test_dealer_analytics_forbidden_for_non_dealer(s):
    # admin (role admin) hits dealer endpoint -> 403
    r = s.get(f"{API}/dealer/analytics",
              headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert r.status_code == 403


def test_dealer_analytics_unauthenticated(s):
    r = s.get(f"{API}/dealer/analytics")
    assert r.status_code == 401


# ---- Cleanup ----
def test_zz_cleanup(s):
    for k in ("v1", "v2", "v3_unpublished"):
        if state.get(k):
            s.delete(f"{API}/dealer/vehicles/{state[k]}",
                     headers={"Authorization": f"Bearer {state['dealer_token']}"})
