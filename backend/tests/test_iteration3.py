"""Iteration 3 tests — dealer profile + reviews public endpoints"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dealer-market.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@auto-markt.de", "password": "Admin123!"}
SEED_DEALER = {"email": "seedfe_1cd7ff@auto-markt.de", "password": "Dealer123!"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def dealer_info():
    """Login the seeded approved dealer and return id+token"""
    r = requests.post(f"{API}/auth/login", json=SEED_DEALER, timeout=30)
    assert r.status_code == 200, f"Seed dealer login failed: {r.text}"
    data = r.json()
    return {"id": data["user"]["id"], "token": data["token"]}


# --- BACKEND DEALER PROFILE ---
class TestDealerProfile:
    def test_get_approved_dealer(self, dealer_info):
        r = requests.get(f"{API}/dealers/{dealer_info['id']}", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] == dealer_info["id"]
        assert "name" in d
        assert "company" in d
        assert "phone" in d
        assert "created_at" in d
        assert isinstance(d["vehicle_count"], int)
        assert d["vehicle_count"] >= 1
        assert "rating_avg" in d
        assert "rating_count" in d

    def test_get_nonexistent_dealer_404(self):
        r = requests.get(f"{API}/dealers/{uuid.uuid4()}", timeout=30)
        assert r.status_code == 404

    def test_get_non_dealer_user_404(self, admin_token):
        # Get admin user id
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=30).json()
        r = requests.get(f"{API}/dealers/{me['id']}", timeout=30)
        # Admin is not a dealer -> 404
        assert r.status_code == 404


# --- BACKEND DEALER VEHICLES ---
class TestDealerVehicles:
    def test_dealer_vehicles_published_only(self, dealer_info):
        r = requests.get(f"{API}/dealers/{dealer_info['id']}/vehicles", timeout=30)
        assert r.status_code == 200
        items = r.json()["items"]
        assert isinstance(items, list)
        assert len(items) >= 1
        for v in items:
            assert v["status"] == "published"
            assert v["dealer_id"] == dealer_info["id"]


# --- BACKEND REVIEWS ---
class TestReviews:
    def test_post_review_valid(self, dealer_info):
        # Capture before
        before = requests.get(f"{API}/dealers/{dealer_info['id']}", timeout=30).json()
        payload = {
            "rating": 5,
            "name": "TEST_Reviewer A",
            "comment": "Sehr freundlicher Händler, super Beratung und faire Preise.",
        }
        r = requests.post(f"{API}/dealers/{dealer_info['id']}/reviews", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["rating"] == 5
        assert data["name"] == "TEST_Reviewer A"
        assert data["dealer_id"] == dealer_info["id"]
        assert data["approved"] is True
        assert "id" in data
        assert "_id" not in data  # ObjectId excluded

        # GET reviews — newly created must appear
        r2 = requests.get(f"{API}/dealers/{dealer_info['id']}/reviews", timeout=30)
        assert r2.status_code == 200
        items = r2.json()["items"]
        ids = [i["id"] for i in items]
        assert data["id"] in ids

        # Aggregate updated
        after = requests.get(f"{API}/dealers/{dealer_info['id']}", timeout=30).json()
        assert after["rating_count"] == before["rating_count"] + 1
        assert after["rating_avg"] >= 0.0

    def test_post_review_rating_out_of_range(self, dealer_info):
        bad = {"rating": 6, "name": "TEST_X", "comment": "Ein langer Kommentar 12345"}
        r = requests.post(f"{API}/dealers/{dealer_info['id']}/reviews", json=bad, timeout=30)
        assert r.status_code == 422, r.text

        bad2 = {"rating": 0, "name": "TEST_X", "comment": "Ein langer Kommentar 12345"}
        r2 = requests.post(f"{API}/dealers/{dealer_info['id']}/reviews", json=bad2, timeout=30)
        assert r2.status_code == 422

    def test_post_review_comment_too_short(self, dealer_info):
        bad = {"rating": 4, "name": "TEST_Y", "comment": "kurz"}
        r = requests.post(f"{API}/dealers/{dealer_info['id']}/reviews", json=bad, timeout=30)
        assert r.status_code == 422

    def test_post_review_to_unknown_dealer(self):
        bad_id = str(uuid.uuid4())
        r = requests.post(f"{API}/dealers/{bad_id}/reviews", json={
            "rating": 5, "name": "TEST_Z", "comment": "Kommentar hier mit genug Zeichen."
        }, timeout=30)
        assert r.status_code == 404

    def test_rating_aggregate_across_multiple(self, dealer_info):
        # Add two more reviews then check average
        before = requests.get(f"{API}/dealers/{dealer_info['id']}", timeout=30).json()
        before_count = before["rating_count"]

        for rating in (3, 4):
            r = requests.post(f"{API}/dealers/{dealer_info['id']}/reviews", json={
                "rating": rating,
                "name": f"TEST_R{rating}",
                "comment": f"Ein ausreichend langer Kommentar mit Rating {rating}.",
            }, timeout=30)
            assert r.status_code == 200

        after = requests.get(f"{API}/dealers/{dealer_info['id']}", timeout=30).json()
        assert after["rating_count"] == before_count + 2
        # rating_avg in [1,5]
        assert 1.0 <= after["rating_avg"] <= 5.0


# Cleanup module-level: delete TEST_ reviews via mongo? Not exposed — skipped.
