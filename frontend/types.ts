export type UserRole =
  | 'ADMIN'
  | 'FRONT_DESK'
  | 'PROPERTY_MANAGER'
  | 'MAINTENANCE_ENGINEER'
  | 'GUEST';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  FRONT_DESK: 'Front Desk',
  PROPERTY_MANAGER: 'Property Manager',
  MAINTENANCE_ENGINEER: 'Maintenance Engineer',
  GUEST: 'Guest',
};

export const formatRole = (role?: string | null): string => {
  if (!role) return '';
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as UserRole];
  }
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  otherInfo?: string;
  role: UserRole;
  hotelId?: number;
}

export interface Hotel {
  id: number;
  name: string;
  address: string;
  city?: string;
  state?: string;
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
  email?: string;
  hotelId?: number;
  token?: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  hotelId?: number;
}

export interface HotelCreatePayload {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
}

export interface UserCreatePayload {
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  otherInfo?: string;
  role: UserRole;
  hotelId?: number;
}

export interface UserUpdatePayload {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  otherInfo?: string;
  role?: UserRole;
  hotelId?: number;
}

export interface RoomCreatePayload {
  hotelId: number;
  roomNumber: number;
  status: RoomStatus;
  roomType: RoomType;
  floor: number;
  pricePerNight: number;
}

export interface BookingReservation {
  id: string;
  roomId: number;
  hotelId: number;
  hotelName: string;
  roomNumber: number;
  roomType?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  nights: number;
  totalPrice: number;
  specialRequests?: string;
  createdAt: string;
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
