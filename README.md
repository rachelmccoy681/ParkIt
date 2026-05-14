# ParkIt

A smart parking management system for a multi-floor shopping mall facility. Drivers can view real-time spot availability, book and manage parking, and receive smart recommendations. Admins can monitor occupancy, manage accounts, and view analytics.

Built for CSCI334 Software Design — Autumn 2026.

---

## Tech Stack

| Layer | Technology                                 |
|---|--------------------------------------------|
| Backend | Java 21 + Spring Boot 3.5                  |
| Database | Supabase (hosted PostgreSQL)               |
| ORM | Spring Data JPA + Hibernate                |
| Auth | JWT (stateless, role-based)                |
| Real-time | Spring WebSocket (STOMP over SockJS)       |
| Frontend | React Native (iOS + Android) — in progress |

---

## Project Structure

```
parkit/
├── backend/    — Spring Boot REST API
└── frontend/   — React Native app (in progress)
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
SEED_ANDREW_PASSWORD=your_personal_admin_password
```

### Running the backend

```bash
cd backend
./mvnw spring-boot:run
```

Server starts on `http://localhost:8000`.

On first startup the seeder automatically creates:
- An admin account (`admin@parkit.com`)
- A parking lot with 2 floors and 18 spots

### Key endpoints

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
| POST | `/api/bookings` | Create a booking |
| POST | `/api/bookings/{id}/cancel` | Cancel a booking |
| PUT | `/api/bookings/{id}/extend` | Extend a booking |
| POST | `/api/recommendations` | Get a spot recommendation |
| GET | `/api/predictions/{floorId}` | Get availability predictions |

WebSocket: connect to `/ws` (STOMP over SockJS), subscribe to `/topic/spots` for live spot status updates.

---

## Frontend — Planned (React Native)

The iOS frontend will be built with React Native and will communicate with the backend via REST and WebSocket.

**Planned screens:**
- Onboarding / Login / Register with email verification
- Interactive parking map with colour-coded spot status (available / reserved / occupied), updated in real time via WebSocket
- Booking flow — select spot, choose duration, confirm and pay
- My Bookings — view active bookings, cancel or extend
- Parking recommendations — least congested floor and best available spot for your vehicle
- Availability predictions — graph of predicted occupancy by floor and time slot
- Profile — manage account details and registered vehicles
- Admin dashboard — occupancy analytics, user management, live sensor feed

**Libraries under consideration:**
- `axios` for REST calls
- `@stomp/stompjs` + `sockjs-client` for WebSocket
- `react-navigation` for screen routing
