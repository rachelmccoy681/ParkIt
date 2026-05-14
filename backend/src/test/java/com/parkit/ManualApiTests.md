# ParkIt — Manual API Test Cases

All tests run against `http://localhost:8000` with the app started via `./mvnw spring-boot:run`.

The full booking flow test suite is automated in Python — run it with:
```
python3 src/test/booking-flow-test.py
```
It covers all 12 cases below and exits with a pass/fail summary.

---

## How the Tests Work

Each test either:
- **Asserts a response field** (e.g. `"bookingId" in response`, `status == "CONFIRMED"`)
- **Asserts an HTTP status code** via curl's `-w "%{http_code}"` flag
- **Asserts an error message** is present (e.g. `"error" in response`)

Auth is done once at the start of each session: `POST /api/auth/login` returns a JWT which is passed as `Authorization: Bearer <token>` on every subsequent request. All token-requiring tests reuse the same token for the session.

### What is covered end-to-end
- JwtAuthenticationFilter validates every Bearer token and sets the security context
- SecurityConfig route rules enforce role checks before controllers are reached
- BookingService business logic (spot availability, vehicle eligibility, pricing)
- ParkingSpotService status transitions broadcast via SensorFeedManager → WebSocket
- PaymentService records a payment on create; addToExistingPayment on extend
- GlobalExceptionHandler maps domain exceptions to correct HTTP status codes

---

## Complete Booking Flow

## Auth

### POST /api/auth/login — valid credentials
```
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"pass1234"}'
```
**Expected:** 200, body contains `token`, `userId`, `email`, `role`

### POST /api/auth/login — wrong password
```
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"wrongpassword"}'
```
**Expected:** 401 `{"error":"Invalid email or password"}`

---

## Users

### POST /api/users/register — new user
```
curl -s -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"pass1234","username":"Alice"}'
```
**Expected:** 201, body contains `userId`, `email`, `username`, `active: true`

### POST /api/users/register — duplicate email
```
curl -s -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"pass1234","username":"Alice2"}'
```
**Expected:** 409 `{"error":"Email already registered"}`

### POST /api/users/register — missing field
```
curl -s -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"pass1234"}'
```
**Expected:** 400 `{"error":"username must not be blank"}`

---

## Bookings — Access Control

Setup: register Alice and Bob, login as Alice to get `$TOKEN1`.

### GET /api/bookings/user/{id} — own bookings (authenticated)
```
curl -s -H "Authorization: Bearer $TOKEN1" \
  http://localhost:8000/api/bookings/user/{aliceId}
```
**Expected:** 200, array (empty if no bookings)

### GET /api/bookings/user/{id} — another user's bookings (same role)
```
curl -s -H "Authorization: Bearer $TOKEN1" \
  http://localhost:8000/api/bookings/user/{bobId}
```
**Expected:** 403 `{"error":"Access denied"}`

### GET /api/bookings/user/{id} — no token
```
curl -s http://localhost:8000/api/bookings/user/{aliceId}
```
**Expected:** 401 `{"error":"Authentication required"}`

### GET /api/bookings/user/{id}/active — own active bookings (authenticated)
```
curl -s -H "Authorization: Bearer $TOKEN1" \
  http://localhost:8000/api/bookings/user/{aliceId}/active
```
**Expected:** 200, array

### GET /api/bookings/user/{id}/active — another user's active bookings
```
curl -s -H "Authorization: Bearer $TOKEN1" \
  http://localhost:8000/api/bookings/user/{bobId}/active
```
**Expected:** 403 `{"error":"Access denied"}`

---

## Bookings — Create

### POST /api/bookings — userId no longer in body
```
curl -s -X POST http://localhost:8000/api/bookings \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"spotId":"{spotId}","vehicleId":"{vehicleId}","startTime":"2026-06-01T10:00:00Z","durationMinutes":60}'
```
**Expected:** 201 if spot and vehicle exist; userId taken from JWT, not body

---

## Vehicles

Setup: login as Alice to get `$TOKEN_ALICE`, login as Bob to get `$TOKEN_BOB`.

### POST /api/vehicles — add a GAS vehicle
```
curl -s -X POST http://localhost:8000/api/vehicles \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber":"ABC123","make":"Toyota","model":"Camry","vehicleType":"GAS","isDisabled":false}'
```
**Expected:** 201, body contains `vehicleId`, `plateNumber`, `make`, `model`, `vehicleType`, `isDisabled`

### POST /api/vehicles — add an EV vehicle
```
curl -s -X POST http://localhost:8000/api/vehicles \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber":"EV9999","make":"Tesla","model":"Model 3","vehicleType":"EV","isDisabled":false}'
```
**Expected:** 201

### GET /api/vehicles/my — list own vehicles
```
curl -s -H "Authorization: Bearer $TOKEN_ALICE" http://localhost:8000/api/vehicles/my
```
**Expected:** 200, array of Alice's vehicles only

### DELETE /api/vehicles/{id} — remove own vehicle
```
curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:8000/api/vehicles/{vehicleId}
```
**Expected:** 204

### DELETE /api/vehicles/{id} — another user's vehicle
```
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN_BOB" \
  http://localhost:8000/api/vehicles/{aliceVehicleId}
```
**Expected:** 403 `{"error":"Access denied"}`

### GET /api/vehicles/my — no token
```
curl -s http://localhost:8000/api/vehicles/my
```
**Expected:** 401 `{"error":"Authentication required"}`

---

## Seeded Data

On first startup (empty DB), `DataSeeder` inserts:
- Admin user: `admin@parkit.com` / `admin1234`
- Parking lot: "Central Parking", "1 George St, Sydney NSW 2000"
- Floor A (capacity 10): 5 STANDARD @ $4/hr, 3 EV @ $6/hr, 2 DISABLED @ $2/hr
- Floor B (capacity 8): 5 STANDARD @ $4/hr, 2 EV @ $6/hr, 1 DISABLED @ $2/hr

Verify:
```
curl -s http://localhost:8000/api/lots
curl -s http://localhost:8000/api/lots/{lotId}/floors
curl -s http://localhost:8000/api/floors/{floorId}/spots
```

---

## Admin-only Endpoints

### PUT /api/users/{id}/suspend — as normal user
```
curl -s -X PUT http://localhost:8000/api/users/{id}/suspend \
  -H "Authorization: Bearer $TOKEN1"
```
**Expected:** 403 `{"error":"Access denied"}`

### PUT /api/spots/{id}/status — as normal user
```
curl -s -X PUT http://localhost:8000/api/spots/{id}/status \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"status":"MAINTENANCE"}'
```
**Expected:** 403 `{"error":"Access denied"}`

---

## WebSocket — Spot Status Updates

Automated test script: `node src/test/ws-test.mjs` (requires app on port 8000).

### SockJS info endpoint
```
curl -s http://localhost:8000/ws/info
```
**Expected:** JSON with `"websocket":true`

### STOMP connect + subscribe (automated)
Run `node src/test/ws-test.mjs`.
**Expected:**
```
[STOMP] CONNECTED — subscribing to /topic/spots
[STOMP] Subscribed to /topic/spots — waiting 3s for messages
STOMP connected:    PASS
Subscribed:         PASS
```

### End-to-end: spot status change broadcasts a message (requires seeded data)
Setup:
1. Have a spot ID in the DB and an admin JWT (`$ADMIN_TOKEN`)
2. Open `ws-test.mjs` (or a STOMP client) and subscribe to `/topic/spots`
3. Trigger a status change:
```
curl -s -X PUT http://localhost:8000/api/spots/{spotId}/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"AVAILABLE"}'
```
**Expected:** WebSocket client receives:
```json
{"spotId":"...","floorId":"...","status":"AVAILABLE","timestamp":"..."}
```

### WebSocket without auth token
```
node src/test/ws-test.mjs
```
**Expected:** STOMP connects (spot data is public, same as `GET /spots/**`)
