export type UserRole =
  | 'ADMIN'
  | 'FRONT_DESK'
  | 'PROPERTY_MANAGER'
  | 'MAINTENANCE_ENGINEER'
  | 'GUEST';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  otherInfo?: string;
  role: UserRole;
  hotelId?: number;
}

export interface Hotel {
  id: number;
  name: string;
  address: string;
  city?: string;
  country?: string;
  logo?: string;
  contactNumber?: string;
  totalRooms: number;
  createdAt?: string;
  rating?: number;
}

export type RoomStatus =
  | 'available'
  | 'OCCUPIED'
  | 'Maintenance'
  | 'occupied'
  | 'cleaning'
  | 'maintenance';

export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Penthouse' | 'Executive';

export interface Room {
  id: number;
  hotelId: number;
  roomNumber: number;
  status: RoomStatus;
  floor?: number;
  pricePerNight?: number;
  guestName?: string;
  roomType?: RoomType;
  checkInDate?: string;
}

export interface ElectricityMeter {
  id: number;
  roomId: number;
  currentReading: number; // kWh
  status: 'Active' | 'Inactive';
}

export interface UserLoginSession {
  userId: number;
  username: string;
  role: UserRole;
  hotelId?: number;
}

export interface HotelCreatePayload {
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface RoomCreatePayload {
  hotelId: number;
  roomNumber: number;
  status: RoomStatus;
  roomType: RoomType;
  floor: number;
  pricePerNight: number;
}

export interface ApiRequestLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  requestBody?: any;
  responseBody?: any;
}
