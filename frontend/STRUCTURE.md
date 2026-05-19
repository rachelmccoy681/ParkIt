# ParkIt Frontend — File Structure

## Tech Stack
- **Expo 55** (React Native 0.83.6, React 19)
- **TypeScript**
- **React Navigation v7** — native stack + bottom tabs
- **Axios** — HTTP client with JWT interceptor
- **@stomp/stompjs** — WebSocket live spot updates
- **expo-linear-gradient** — purple gradient UI (Option B style)
- **@expo/vector-icons** — Ionicons for tab bar

---

## Root

```
frontend/
├── App.tsx              Entry point — wraps app in AuthProvider + RootNavigator
├── app.json             Expo config (name, slug, splash, icons)
├── tsconfig.json        TypeScript config
├── package.json         Dependencies
└── src/
```

---

## src/

### api/
HTTP layer — all functions return Axios promises typed against backend DTOs.

| File | Endpoints |
|------|-----------|
| `client.ts` | Axios instance (`BASE_URL = http://localhost:8000`), JWT Bearer interceptor, `WS_URL` for WebSocket |
| `auth.ts` | `login`, `register`, `verifyEmail`, `forgotPassword`, `resetPassword` |
| `users.ts` | `getUser`, `updateEmail`, `updatePassword`, `suspendUser`, `reactivateUser`, `getUserByEmail` |
| `vehicles.ts` | `getMyVehicles`, `addVehicle`, `removeVehicle` |
| `lots.ts` | `getLots`, `getFloors`, `getSpots`, `getAvailableSpots`, `getSpot`, `updateSpotStatus` |
| `bookings.ts` | `createBooking`, `getActiveBookings`, `getBooking`, `cancelBooking`, `extendBooking` |
| `recommendations.ts` | `getRecommendation` |
| `predictions.ts` | `getPredictions`, `generatePredictions` |

### context/
| File | Purpose |
|------|---------|
| `AuthContext.tsx` | Global auth state (token, userId, email, role). `login()` persists to AsyncStorage. `logout()` clears it. `useAuth()` hook. |

### hooks/
| File | Purpose |
|------|---------|
| `useSpotUpdates.ts` | STOMP WebSocket client connecting to `/topic/spots`. Calls `onMessage(SpotStatusMessage)` on each update. Auto-reconnects every 5s. |

### navigation/
| File | Purpose |
|------|---------|
| `RootNavigator.tsx` | Shows loading spinner → routes to `AuthStack` (no token), `DriverTabs` (USER role), or `AdminStack` (ADMIN role) |
| `AuthStack.tsx` | Login → Register → VerifyEmail, ForgotPassword → ResetPassword |
| `DriverTabs.tsx` | 4 bottom tabs: Map, Bookings, Explore, Profile — each with its own nested stack |
| `AdminStack.tsx` | AdminDashboard → UserManagement, SpotControl |

#### DriverTabs stacks
| Tab | Stack screens |
|-----|--------------|
| **Map** | ParkingMap → SpotDetail → BookingForm |
| **Bookings** | MyBookings → BookingDetail |
| **Explore** | Recommendation → Prediction |
| **Profile** | ProfileHome → VehicleList → AddVehicle |

### screens/

#### auth/
| Screen | API used | Purpose |
|--------|----------|---------|
| `LoginScreen` | `auth.login` | Email + password → JWT login |
| `RegisterScreen` | `auth.register` | Username + email + password → navigates to VerifyEmail |
| `VerifyEmailScreen` | `auth.verifyEmail` | 6-digit code input → unlocks login |
| `ForgotPasswordScreen` | `auth.forgotPassword` | Sends reset code → navigates to ResetPassword |
| `ResetPasswordScreen` | `auth.resetPassword` | Code + new password → back to Login |

#### driver/
| Screen | API used | Purpose |
|--------|----------|---------|
| `ParkingMapScreen` | `lots.getLots/getFloors/getSpots`, `useSpotUpdates` | Lot selector → floor pills → 5-col spot grid with live WebSocket colour updates. Tap AVAILABLE spot → SpotDetail |
| `SpotDetailScreen` | *(spot from nav params)* | Type icon, status badge, hourly rate. Book button → BookingForm |
| `BookingFormScreen` | `vehicles.getMyVehicles`, `bookings.createBooking` | Vehicle picker + duration chips (1–24h) + price preview → confirm booking |
| `MyBookingsScreen` | `bookings.getActiveBookings` | List of active bookings with status badges and time bars |
| `BookingDetailScreen` | `bookings.getBooking/cancelBooking/extendBooking` | Full booking info, extend chips (+30m–+3h), cancel button |
| `RecommendationScreen` | `vehicles.getMyVehicles`, `recommendations.getRecommendation` | Select vehicle → get AI-suggested spot + reason |
| `PredictionScreen` | `predictions.getPredictions/generatePredictions` | Horizontal bar chart of predicted availability per time slot |
| `ProfileScreen` | `users.getUser/updateEmail/updatePassword`, `vehicles.getMyVehicles/removeVehicle`, `bookings.getActiveBookings` | Gradient header with live stats, vehicle chips, change email/password modals, logout |
| `VehicleListScreen` | `vehicles.getMyVehicles/removeVehicle` | Full vehicle list with remove + add button |
| `AddVehicleScreen` | `vehicles.addVehicle` | Plate/make/model form, fuel type chips, disability toggle, live preview |

#### admin/
| Screen | API used | Purpose |
|--------|----------|---------|
| `AdminDashboardScreen` | `lots.getLots/getFloors`, `useAuth` | Lot/floor overview with occupancy bars, navigate to UserManagement or SpotControl per floor |
| `UserManagementScreen` | `users.getUserByEmail/suspendUser/reactivateUser` | Search user by email → view details → suspend or reactivate |
| `SpotControlScreen` | `lots.getSpots/updateSpotStatus` | 4-col spot grid — tap any spot to toggle its status |

### theme.ts
Single source of truth for all design tokens — import instead of hardcoding values.

| Export | Contents |
|--------|---------|
| `colors` | Primary purple palette, semantic colours (success/warning/danger/info), surfaces, text, borders, spot status, vehicle type colours |
| `gradients` | `primary` (vertical), `primaryHorizontal`, `avatar` |
| `spacing` | xs(4) sm(8) md(16) lg(24) xl(32) xxl(48) |
| `radius` | sm(8) md(12) lg(16) xl(24) full(9999) |
| `typography` | h1–h3, body, bodyMedium, bodySemiBold, caption, label, button |
| `shadows` | sm, md, avatar |

### types/index.ts
TypeScript interfaces mirroring backend DTOs exactly. Update here when backend DTOs change.

`AuthResponse`, `UserResponse`, `VehicleResponse`, `ParkingLotResponse`, `ParkingFloorResponse`, `ParkingSpotResponse`, `BookingResponse`, `PaymentResponse`, `RecommendationResponse`, `PredictionResponse`, `SpotStatusMessage`, `CreateBookingRequest`, `CreateVehicleRequest`, `ExtendBookingRequest`

---

## Key Design Decisions

**Option B (Rich & Immersive) UI** — all screens use `expo-linear-gradient` purple headers, white card bodies, and tokens from `theme.ts`. No global CSS (React Native has no cascade — each screen has its own `StyleSheet.create`).

**JWT auth flow** — `AuthContext` loads token from `AsyncStorage` on boot. `RootNavigator` gates routing on `role`. All Axios requests attach `Authorization: Bearer <token>` automatically via interceptor.

**WebSocket** — connects directly to `/ws/websocket` (bypasses SockJS, which doesn't work in React Native). `useSpotUpdates` hook manages connection lifecycle; `ParkingMapScreen` uses it to update spot colours in real time without a full refresh.

**No Redux** — auth state in React Context is sufficient for this app's scope.
