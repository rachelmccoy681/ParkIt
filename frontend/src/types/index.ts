// Mirrors backend DTOs exactly, change when changing DTOs

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface UserResponse {
  userId: string;
  email: string;
  username: string;
  registeredDate: string;
  active: boolean;
  emailVerified: boolean;
}

export interface VehicleResponse {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  vehicleType: 'GAS' | 'EV' | 'HYBRID';
  isDisabled: boolean;
}

export interface ParkingLotResponse {
  lotId: string;
  name: string;
  address: string;
}

export interface ParkingFloorResponse {
  floorId: string;
  floorLabel: string;
  capacity: number;
  occupancyRate: number;
}

export interface ParkingSpotResponse {
  spotId: string;
  floorId: string;
  spotType: 'STANDARD' | 'EV' | 'DISABLED';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  hourlyRate: number;
}

export interface BookingResponse {
  bookingId: string;
  userId: string;
  spotId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'EXTENDED';
  floorLabel: string;
  spotType: 'STANDARD' | 'EV' | 'DISABLED';
}

export interface PaymentResponse {
  paymentId: string;
  bookingId: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  timestamp: string;
}

export interface RecommendationResponse {
  recommendationId: string;
  vehicleId: string;
  suggestedFloorId: string;
  suggestedSpotId: string;
  reason: string;
}

export interface PredictionResponse {
  predictionId: string;
  floorId: string;
  timeSlot: string;
  predictedAvailability: number;
}

export interface PeakHourPoint {
  hour: number;
  avgOccupancyRate: number;
}

export interface DayBreakdown {
  day: string;
  avgOccupancyRate: number;
}

export interface UtilizationSummary {
  floorId: string;
  floorLabel: string;
  avgUtilizationRate: number;
  peakHour: number;
  peakDayOfWeek: string;
  dayOfWeekBreakdown: DayBreakdown[];
}

// WebSocket event pushed to /topic/spots
export interface SpotStatusMessage {
  spotId: string;
  floorId: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  timestamp: string;
}

// Request bodies
export interface CreateBookingRequest {
  spotId: string;
  vehicleId: string;
  startTime: string;
  durationMinutes: number;
}

export interface CreateVehicleRequest {
  plateNumber: string;
  make: string;
  model: string;
  vehicleType: 'GAS' | 'EV' | 'HYBRID';
  isDisabled: boolean;
}

export interface ExtendBookingRequest {
  additionalMinutes: number;
}

export interface EditBookingRequest {
  spotId: string;
  vehicleId: string;
  startTime: string;
  durationMinutes: number;
}

export interface AdminCreateBookingRequest {
  userId: string;
  spotId: string;
  vehicleId: string;
  startTime: string;
  durationMinutes: number;
}
