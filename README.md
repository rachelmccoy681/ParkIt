# ParkIt

A smart parking management system for a multi-floor shopping mall facility. Drivers can view real-time spot availability, book and manage parking, and receive smart recommendations. Admins can monitor occupancy, manage accounts, and view analytics.

Built for CSCI334 Software Design — Autumn 2026.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 + Spring Boot 3.5 |
| Database | Supabase (hosted PostgreSQL) |
| ORM | Spring Data JPA + Hibernate |
| Auth | JWT (stateless, role-based) |
| Real-time | Spring WebSocket (STOMP over SockJS) |
| Frontend | React Native (Expo) — iOS + Android |

---

## Project Structure

```
parkit/
├── backend/    — Spring Boot REST API
└── frontend/   — React Native app
```

---

## Backend Setup

### Prerequisites
- Java 21
- Maven (or use the included `./mvnw` wrapper)

### Environment variables

Create `backend/.env` with the following:

```
DB_URL=your_supabase_jdbc_url
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
jwt.secret=your_jwt_secret
jwt.expiration-ms=86400000
GMAIL_USERNAME=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
SEED_ADMIN_PASSWORD=your_admin_password
SEED_ANDREW_PASSWORD=your_personal_password
SEED_TEST_PASSWORD=your_test_password
```

### Running the backend

```bash
cd backend
./mvnw spring-boot:run
```

Server starts on `http://localhost:8000`.

On first startup the seeder automatically creates:
- An admin account (`admin@parkit.com`)
- A parking lot with 2 floors and 18 spots (standard, EV, and accessible)

---

## Frontend Setup

### Prerequisites
- Node.js
- Expo CLI (`npm install -g expo-cli`)

### Running the frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go on your device, or press `i` for iOS simulator / `a` for Android emulator.

---

## Features

**Driver**
- Register with email verification, login, forgot/reset password
- Real-time parking map with colour-coded spot availability (updated via WebSocket)
- Book a spot, select duration and vehicle, schedule future bookings
- View, edit, extend, cancel, and check in to bookings
- Smart spot recommendation based on vehicle type and floor congestion
- 24-hour availability forecast by floor

**Admin**
- Dashboard with live occupancy stats
- Manage all bookings — view, create, delete
- User management — suspend and reactivate accounts
- Spot control — update spot status per floor
- Analytics — utilisation summary, peak hours, day breakdown

---

## Design Patterns

| Pattern | Where |
|---|---|
| Factory | `ParkingSpotFactory` — creates the correct spot subtype (Standard, EV, Accessible) |
| Strategy | `PricingStrategy` / `HourlyPricingStrategy` / `HolidayPricingStrategy` — injected into `BookingService` |
| Singleton | `SensorFeedManager` — single instance managing all spot status events |
| Observer | `SensorFeedManager` notifies `SpotStatusPublisher` which pushes updates over WebSocket |
| Repository | All data access goes through repository interfaces — no service touches the DB directly |

---

## Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/verify-email` | Verify email after registration |
| POST | `/api/auth/forgot-password` | Send password reset code |
| POST | `/api/auth/reset-password` | Reset password with code |
| POST | `/api/users/register` | Register a new driver |
| GET | `/api/lots` | List all parking lots |
| GET | `/api/lots/{id}/floors` | List floors in a lot |
| GET | `/api/floors/{id}/spots` | List spots on a floor |
| GET | `/api/floors/{id}/spots/bookable` | List spots available for a time window |
| POST | `/api/bookings` | Create a booking |
| PUT | `/api/bookings/{id}` | Edit a booking |
| POST | `/api/bookings/{id}/cancel` | Cancel a booking |
| PUT | `/api/bookings/{id}/extend` | Extend a booking |
| POST | `/api/bookings/{id}/checkin` | Check in to a booking |
| POST | `/api/vehicles` | Add a vehicle |
| GET | `/api/vehicles/my` | Get current user's vehicles |
| POST | `/api/recommendations` | Get a spot recommendation |
| GET | `/api/predictions/{floorId}` | Get availability predictions for a floor |
| GET | `/api/analytics/utilization` | Utilisation summary |
| GET | `/api/analytics/peak-hours` | Peak hour breakdown |

WebSocket: connect to `/ws` (STOMP over SockJS), subscribe to `/topic/spots` for live spot status updates.
