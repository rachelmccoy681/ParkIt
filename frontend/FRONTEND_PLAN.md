# ParkIt — Frontend Plan

## Decision Summary

**Framework:** React Native with Expo 55
**Language:** TypeScript
**Primary platform:** iOS (physical iPhone for testing via Expo Go)
**Secondary platform:** Android (supported via same codebase, untested physically)

React Native was chosen because:
- Andrew has existing React experience — component model, hooks, and state transfer directly
- Expo abstracts iOS/Android build complexity
- One codebase covers both platforms at no extra cost
- Kotlin/Jetpack Compose experience helps understand the Android layer
- Only has an iPhone to test on, ruling out Android-native as primary

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Expo 55 + React Native |
| Language | TypeScript |
| Navigation | React Navigation v7 (stack + bottom tabs) |
| HTTP | Axios (with JWT interceptor) |
| Auth storage | AsyncStorage (JWT token persistence) |
| Global state | React Context (auth only) |
| Real-time | @stomp/stompjs — connects to ws://[host]/ws/websocket |
| Styling | StyleSheet API (built-in, no extra library) |

**WebSocket note:** React Native cannot perform the SockJS HTTP handshake.
Connect directly to the raw WebSocket endpoint at /ws/websocket instead of /ws.
The Spring backend's SockJS setup exposes this endpoint automatically.

---

## Folder Structure

```
src/
├── api/
│   ├── client.ts           — axios instance, base URL, JWT interceptor
│   ├── auth.ts             — login, register, verifyEmail, forgotPassword, resetPassword
│   ├── users.ts            — getUser, updateEmail, updatePassword
│   ├── lots.ts             — getLots, getFloors, getSpots, getAvailableSpots
│   ├── bookings.ts         — createBooking, cancelBooking, extendBooking, getMyBookings
│   ├── vehicles.ts         — addVehicle, getMyVehicles, removeVehicle
│   ├── recommendations.ts  — getRecommendation
│   └── predictions.ts      — getPredictions
├── context/
│   └── AuthContext.tsx     — token, userId, email, role, login(), logout()
├── hooks/
│   ├── useAuth.ts          — shortcut hook for AuthContext
│   └── useSpotUpdates.ts   — STOMP WebSocket subscription to /topic/spots
├── navigation/
│   ├── AuthStack.tsx       — Login, Register, VerifyEmail, ForgotPassword, ResetPassword
│   ├── DriverTabs.tsx      — bottom tab navigator for drivers
│   ├── AdminStack.tsx      — stack navigator for admins
│   └── RootNavigator.tsx   — switches between AuthStack / DriverTabs / AdminStack based on role
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── VerifyEmailScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   └── ResetPasswordScreen.tsx
│   ├── driver/
│   │   ├── ParkingMapScreen.tsx      — floor selector + spot grid, live via WebSocket
│   │   ├── SpotDetailScreen.tsx      — spot info, book button
│   │   ├── BookingFormScreen.tsx     — duration picker, confirm + pay
│   │   ├── MyBookingsScreen.tsx      — active and past bookings list
│   │   ├── BookingDetailScreen.tsx   — view, cancel, extend
│   │   ├── RecommendationScreen.tsx  — smart spot suggestion
│   │   ├── PredictionScreen.tsx      — availability graph by floor
│   │   ├── ProfileScreen.tsx         — personal details
│   │   ├── VehicleListScreen.tsx     — registered vehicles
│   │   └── AddVehicleScreen.tsx      — add new vehicle form
│   └── admin/
│       ├── AdminDashboardScreen.tsx  — occupancy stats, spot counts per floor
│       ├── UserManagementScreen.tsx  — list drivers, suspend/reactivate
│       └── SpotControlScreen.tsx     — manually update spot status
├── components/
│   ├── SpotGrid.tsx         — floor map grid of spots coloured by status
│   ├── SpotCard.tsx         — individual spot tile
│   ├── BookingCard.tsx      — booking list item
│   ├── FloorSelector.tsx    — tab/pill selector for floors
│   └── LoadingOverlay.tsx   — full-screen loading indicator
└── types/
    └── index.ts             — TypeScript interfaces mirroring all backend DTOs
```

---

## Navigation Structure

```
RootNavigator
├── AuthStack (when no token)
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── VerifyEmailScreen
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen
├── DriverTabs (token + role = USER)
│   ├── Map tab
│   │   ├── ParkingMapScreen
│   │   ├── SpotDetailScreen
│   │   └── BookingFormScreen
│   ├── Bookings tab
│   │   ├── MyBookingsScreen
│   │   └── BookingDetailScreen
│   ├── Explore tab
│   │   ├── RecommendationScreen
│   │   └── PredictionScreen
│   └── Profile tab
│       ├── ProfileScreen
│       ├── VehicleListScreen
│       └── AddVehicleScreen
└── AdminStack (token + role = ADMIN)
    ├── AdminDashboardScreen
    ├── UserManagementScreen
    └── SpotControlScreen
```

---

## Screens

### Auth
| Screen | Endpoint used |
|---|---|
| LoginScreen | POST /api/auth/login |
| RegisterScreen | POST /api/users/register |
| VerifyEmailScreen | POST /api/auth/verify-email |
| ForgotPasswordScreen | POST /api/auth/forgot-password |
| ResetPasswordScreen | POST /api/auth/reset-password |

### Driver
| Screen | Endpoint used |
|---|---|
| ParkingMapScreen | GET /api/lots, /api/lots/{id}/floors, /api/floors/{id}/spots + WebSocket /topic/spots |
| SpotDetailScreen | (data passed from map) |
| BookingFormScreen | POST /api/bookings |
| MyBookingsScreen | GET /api/bookings/user/{id}/active |
| BookingDetailScreen | POST /api/bookings/{id}/cancel, PUT /api/bookings/{id}/extend |
| RecommendationScreen | POST /api/recommendations |
| PredictionScreen | GET /api/predictions/{floorId} |
| ProfileScreen | GET /api/users/{id}, PUT /api/users/{id}/email, PUT /api/users/{id}/password |
| VehicleListScreen | GET /api/vehicles/my |
| AddVehicleScreen | POST /api/vehicles, DELETE /api/vehicles/{id} |

### Admin
| Screen | Endpoint used |
|---|---|
| AdminDashboardScreen | GET /api/lots, /api/lots/{id}/floors, /api/floors/{id}/spots |
| UserManagementScreen | GET /api/users/by-email, PUT /api/users/{id}/suspend, PUT /api/users/{id}/reactivate |
| SpotControlScreen | GET /api/floors/{id}/spots, PUT /api/spots/{id}/status |

---

## Key Design Decisions

- No Redux — React Context is sufficient for auth state; screens manage their own local state
- No Expo Router — React Navigation is more explicit and better suited to this project size
- SockJS bypassed — STOMP client connects to ws://[host]/ws/websocket directly
- Admin and driver are entirely separate navigation stacks, selected in RootNavigator based on role from the JWT response
- All API types are defined in src/types/index.ts to mirror backend DTOs exactly
