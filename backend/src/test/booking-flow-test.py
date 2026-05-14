    #!/usr/bin/env python3
"""
ParkIt — Booking Flow Integration Tests
Run: python3 src/test/booking-flow-test.py
Requires the app running at http://localhost:8000 with seeded data.
"""

import json
import sys
import urllib.request
import urllib.error
import uuid

BASE = "http://localhost:8000"
_pass = 0
_fail = 0


def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            try:
                return resp.status, json.loads(resp.read())
            except Exception:
                return resp.status, {}
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def check(name, condition, detail=""):
    global _pass, _fail
    if condition:
        print(f"  PASS  {name}")
        _pass += 1
    else:
        print(f"  FAIL  {name}" + (f"  [{detail}]" if detail else ""))
        _fail += 1


# ── Auth ──────────────────────────────────────────────────────────────────────

print("\n[Auth]")

status, body = req("POST", "/api/auth/login",
                   {"email": "alice@test.com", "password": "wrongpassword"})
check("wrong password → 401", status == 401)
check("error message present", "error" in body, str(body))

# ── Users / Register ──────────────────────────────────────────────────────────

print("\n[Users]")

suffix      = uuid.uuid4().hex[:6]
alice_email = f"alice_{suffix}@test.com"
bob_email   = f"bob_{suffix}@test.com"
alice_name  = f"Alice_{suffix}"
bob_name    = f"Bob_{suffix}"

status, body = req("POST", "/api/users/register",
                   {"email": alice_email, "password": "pass1234", "username": alice_name})
check("register Alice → 201", status == 201, str(body))
check("register returns userId", "userId" in body, str(body))
alice_id = body.get("userId")

status, body = req("POST", "/api/users/register",
                   {"email": alice_email, "password": "pass1234", "username": alice_name + "2"})
check("duplicate email → 409", status == 409, str(body))

status, body = req("POST", "/api/users/register",
                   {"email": f"x_{uuid.uuid4().hex[:6]}@test.com", "password": "pass1234"})
check("missing username → 400", status == 400, str(body))

status, body = req("POST", "/api/users/register",
                   {"email": bob_email, "password": "pass1234", "username": bob_name})
check("register Bob → 201", status == 201, str(body))
bob_id = body.get("userId")

# ── Login ─────────────────────────────────────────────────────────────────────

print("\n[Login]")

status, body = req("POST", "/api/auth/login", {"email": alice_email, "password": "pass1234"})
check("login Alice → 200", status == 200, str(body))
check("token in response", "token" in body, str(body))
TOKEN_ALICE = body.get("token")

status, body = req("POST", "/api/auth/login", {"email": bob_email, "password": "pass1234"})
check("login Bob → 200", status == 200, str(body))
TOKEN_BOB = body.get("token")

status, body = req("POST", "/api/auth/login",
                   {"email": "admin@parkit.com", "password": "admin1234"})
check("login admin → 200", status == 200, str(body))
TOKEN_ADMIN = body.get("token")

if not TOKEN_ALICE or not TOKEN_BOB or not TOKEN_ADMIN:
    print("\nFATAL: could not obtain tokens — is the app running?")
    sys.exit(1)

# ── Access Control — no token ─────────────────────────────────────────────────

print("\n[Access Control — No Token]")

status, body = req("GET", f"/api/bookings/user/{alice_id}")
check("bookings without token → 401", status == 401, str(body))
check("error: Authentication required", body.get("error") == "Authentication required", str(body))

status, _ = req("GET", "/api/vehicles/my")
check("vehicles without token → 401", status == 401)

# ── Access Control — cross-user ───────────────────────────────────────────────

print("\n[Access Control — Cross-User]")

status, body = req("GET", f"/api/bookings/user/{bob_id}", token=TOKEN_ALICE)
check("Alice cannot view Bob's bookings → 403", status == 403, str(body))

status, body = req("GET", f"/api/bookings/user/{bob_id}/active", token=TOKEN_ALICE)
check("Alice cannot view Bob's active bookings → 403", status == 403, str(body))

# ── Seeded data ───────────────────────────────────────────────────────────────

print("\n[Seeded Data]")

status, lots = req("GET", "/api/lots")
check("GET /api/lots → 200", status == 200, str(lots))
check("at least one lot seeded", isinstance(lots, list) and len(lots) > 0, str(lots))
lot_id = lots[0]["lotId"] if lots else None

status, floors = req("GET", f"/api/lots/{lot_id}/floors")
check("GET floors → 200", status == 200, str(floors))
check("floors present", isinstance(floors, list) and len(floors) > 0, str(floors))

# Search all floors for available spots so prior test runs don't leave stale RESERVED spots
all_spots = []
floor_id = None
for floor in (floors or []):
    _, fspots = req("GET", f"/api/floors/{floor['floorId']}/spots")
    if isinstance(fspots, list):
        all_spots.extend(fspots)
        if floor_id is None and fspots:
            floor_id = floor["floorId"]

status_check, _ = req("GET", f"/api/floors/{floor_id}/spots") if floor_id else (200, [])
check("GET spots → 200", status_check == 200, str(all_spots[:2]))
check("spots present", len(all_spots) > 0, str(all_spots))

standard_spot = next((s for s in all_spots if s.get("spotType") == "STANDARD"
                       and s.get("status") == "AVAILABLE"), None)
ev_spot       = next((s for s in all_spots if s.get("spotType") == "EV"
                       and s.get("status") == "AVAILABLE"), None)
check("STANDARD spot available", standard_spot is not None, str([s["spotType"] for s in all_spots]))
check("EV spot available",       ev_spot is not None,       str([s["spotType"] for s in all_spots]))

if not standard_spot:
    print("\nFATAL: no STANDARD spot available — re-seed the DB and retry")
    sys.exit(1)

standard_spot_id = standard_spot["spotId"]
floor_id         = standard_spot["floorId"]
ev_spot_id       = ev_spot["spotId"] if ev_spot else None

# ── Vehicles ──────────────────────────────────────────────────────────────────

print("\n[Vehicles]")

status, body = req("POST", "/api/vehicles",
                   {"plateNumber": f"GAS{uuid.uuid4().hex[:4].upper()}", "make": "Toyota",
                    "model": "Camry", "vehicleType": "GAS", "isDisabled": False},
                   token=TOKEN_ALICE)
check("add GAS vehicle → 201", status == 201, str(body))
check("vehicleId returned", "vehicleId" in body, str(body))
gas_vehicle_id = body.get("vehicleId")

status, body = req("POST", "/api/vehicles",
                   {"plateNumber": f"EV{uuid.uuid4().hex[:4].upper()}", "make": "Tesla",
                    "model": "Model 3", "vehicleType": "EV", "isDisabled": False},
                   token=TOKEN_ALICE)
check("add EV vehicle → 201", status == 201, str(body))
ev_vehicle_id = body.get("vehicleId")

status, body = req("GET", "/api/vehicles/my", token=TOKEN_ALICE)
check("list own vehicles → 200", status == 200, str(body))
check("both vehicles listed", isinstance(body, list) and len(body) == 2, str(body))

status, body = req("DELETE", f"/api/vehicles/{gas_vehicle_id}", token=TOKEN_BOB)
check("Bob cannot delete Alice's vehicle → 403", status == 403, str(body))

# ── Booking Flow ──────────────────────────────────────────────────────────────

print("\n[Booking Flow]")

# 1. Create booking: GAS car on STANDARD spot, 60 min → $4.00
status, body = req("POST", "/api/bookings",
                   {"spotId": standard_spot_id, "vehicleId": gas_vehicle_id,
                    "startTime": "2026-08-01T10:00:00Z", "durationMinutes": 60},
                   token=TOKEN_ALICE)
check("1. create booking → 201", status == 201, str(body))
check("   status CONFIRMED", body.get("status") == "CONFIRMED", str(body))
check("   cost $4.00 (1 hr × $4/hr)", abs(body.get("totalAmount", -1) - 4.0) < 0.01, str(body))
check("   userId from JWT, not body", body.get("userId") == alice_id, str(body))
booking_id = body.get("bookingId")

# 2. Spot is RESERVED
_, spots_after = req("GET", f"/api/floors/{floor_id}/spots")
booked = next((s for s in spots_after if s["spotId"] == standard_spot_id), None)
check("2. spot is RESERVED after booking",
      booked is not None and booked.get("status") == "RESERVED", str(booked))

# 3. Booking visible in user list and active list
_, all_bookings = req("GET", f"/api/bookings/user/{alice_id}", token=TOKEN_ALICE)
check("3. booking in /user/{id}",
      any(b.get("bookingId") == booking_id for b in (all_bookings or [])), str(all_bookings))

_, active = req("GET", f"/api/bookings/user/{alice_id}/active", token=TOKEN_ALICE)
check("   booking in /user/{id}/active",
      any(b.get("bookingId") == booking_id for b in (active or [])), str(active))

# 4. Extend booking by 30 min
status, body = req("PUT", f"/api/bookings/{booking_id}/extend",
                   {"additionalMinutes": 30}, token=TOKEN_ALICE)
check("4. extend booking → 204", status == 204, str(body))

# 5. Double-book same spot → error
status, body = req("POST", "/api/bookings",
                   {"spotId": standard_spot_id, "vehicleId": gas_vehicle_id,
                    "startTime": "2026-08-01T12:00:00Z", "durationMinutes": 30},
                   token=TOKEN_ALICE)
check("5. double-book → 4xx", status >= 400, str(body))
check("   error: spot not available",
      "not available" in body.get("error", "").lower(), str(body))

# 6. GAS vehicle on EV spot → ineligible
if ev_spot_id:
    status, body = req("POST", "/api/bookings",
                       {"spotId": ev_spot_id, "vehicleId": gas_vehicle_id,
                        "startTime": "2026-08-01T10:00:00Z", "durationMinutes": 60},
                       token=TOKEN_ALICE)
    check("6. GAS car on EV spot → 4xx", status >= 400, str(body))
    check("   error: not eligible",
          "eligible" in body.get("error", "").lower(), str(body))

    # 7. EV vehicle on EV spot, 2 hr → $12.00
    status, body = req("POST", "/api/bookings",
                       {"spotId": ev_spot_id, "vehicleId": ev_vehicle_id,
                        "startTime": "2026-08-01T10:00:00Z", "durationMinutes": 120},
                       token=TOKEN_ALICE)
    check("7. EV car on EV spot → 201", status == 201, str(body))
    check("   cost $12.00 (2 hr × $6/hr)",
          abs(body.get("totalAmount", -1) - 12.0) < 0.01, str(body))
    ev_booking_id = body.get("bookingId")
else:
    print("  SKIP  6–7: no EV spot found")
    ev_booking_id = None

# 8. Admin updates spot status
status, body = req("PUT", f"/api/spots/{standard_spot_id}/status",
                   {"status": "OCCUPIED"}, token=TOKEN_ADMIN)
check("8. admin sets spot OCCUPIED → 204", status == 204, str(body))

_, spots_check = req("GET", f"/api/floors/{floor_id}/spots")
s = next((x for x in spots_check if x["spotId"] == standard_spot_id), None)
check("   spot reads OCCUPIED", s is not None and s.get("status") == "OCCUPIED", str(s))

# Restore so cancel can set it back to AVAILABLE
req("PUT", f"/api/spots/{standard_spot_id}/status", {"status": "RESERVED"}, token=TOKEN_ADMIN)

# 9. Cancel booking → spot AVAILABLE
status, body = req("POST", f"/api/bookings/{booking_id}/cancel", token=TOKEN_ALICE)
check("9. cancel booking → 204", status == 204, str(body))

_, spots_post = req("GET", f"/api/floors/{floor_id}/spots")
s = next((x for x in spots_post if x["spotId"] == standard_spot_id), None)
check("   spot AVAILABLE after cancel",
      s is not None and s.get("status") == "AVAILABLE", str(s))

# 10. Cancelled booking not in active list
_, active_post = req("GET", f"/api/bookings/user/{alice_id}/active", token=TOKEN_ALICE)
check("10. cancelled booking absent from active list",
      not any(b.get("bookingId") == booking_id for b in (active_post or [])),
      str(active_post))

# 11. Normal user cannot change spot status → 403
status, body = req("PUT", f"/api/spots/{standard_spot_id}/status",
                   {"status": "OCCUPIED"}, token=TOKEN_ALICE)
check("11. normal user sets spot status → 403", status == 403, str(body))

# 12. No token → 401 (already covered above, confirm once more end-to-end)
status, body = req("GET", f"/api/bookings/user/{alice_id}")
check("12. no token → 401", status == 401, str(body))

# ── Cleanup — cancel EV booking so the spot is free for the next test run ─────
if ev_booking_id:
    status, body = req("POST", f"/api/bookings/{ev_booking_id}/cancel", token=TOKEN_ALICE)
    check("13. cancel EV booking → 204", status == 204, str(body))

    _, spots_ev = req("GET", f"/api/floors/{ev_spot['floorId']}/spots")
    ev_spot_after = next((s for s in spots_ev if s["spotId"] == ev_spot_id), None)
    check("    EV spot AVAILABLE after cancel",
          ev_spot_after is not None and ev_spot_after.get("status") == "AVAILABLE",
          str(ev_spot_after))

# ── Summary ───────────────────────────────────────────────────────────────────

total = _pass + _fail
bar   = "═" * 44
print(f"\n{bar}")
if _fail == 0:
    print(f"  {_pass}/{total} passed — all tests pass")
else:
    print(f"  {_pass}/{total} passed — {_fail} FAILED")
print(f"{bar}\n")

sys.exit(0 if _fail == 0 else 1)
