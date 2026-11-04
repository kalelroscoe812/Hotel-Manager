import {
  ElectricityMeter,
  Hotel,
  HotelCreatePayload,
  Room,
  RoomCreatePayload,
  User,
} from './types';

const API_BASE_URL = '/api';

interface ApiHotel {
  id: number;
  name: string;
  address: string;
  city?: string | null;
  country?: string | null;
  logo?: string | null;
  contact_number?: string | null;
  total_rooms: number;
}

interface ApiRoom {
  id: number;
  hotel_id: number;
  room_number: number;
  status: Room['status'];
  floor?: number | null;
  nightly_price?: number | string | null;
  room_type?: string | null;
}

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  other_info?: string | null;
  role: User['role'];
  hotel_id?: number | null;
}

interface ApiMeter {
  id: number;
  room_id: number;
  current_reading: number;
  status: ElectricityMeter['status'];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail
        : `Request failed (${response.status} ${response.statusText})`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const toHotel = (hotel: ApiHotel): Hotel => ({
  id: hotel.id,
  name: hotel.name,
  address: hotel.address,
  city: hotel.city ?? '',
  country: hotel.country ?? '',
  logo: hotel.logo ?? undefined,
  contactNumber: hotel.contact_number ?? undefined,
  totalRooms: hotel.total_rooms,
});

const toRoom = (room: ApiRoom): Room => ({
  id: room.id,
  hotelId: room.hotel_id,
  roomNumber: room.room_number,
  status: room.status,
  floor: room.floor ?? undefined,
  pricePerNight: room.nightly_price == null ? undefined : Number(room.nightly_price),
  roomType: room.room_type as Room['roomType'],
});

const toUser = (user: ApiUser): User => ({
  id: user.id,
  username: user.username,
  firstName: user.first_name,
  lastName: user.last_name,
  otherInfo: user.other_info ?? undefined,
  role: user.role,
  hotelId: user.hotel_id ?? undefined,
});

const toMeter = (meter: ApiMeter): ElectricityMeter => ({
  id: meter.id,
  roomId: meter.room_id,
  currentReading: meter.current_reading,
  status: meter.status,
});

export async function loadBackendData() {
  const [hotels, rooms, users, meters] = await Promise.all([
    request<ApiHotel[]>('/hotels?page_size=100'),
    request<ApiRoom[]>('/rooms?page_size=100'),
    request<ApiUser[]>('/users?page_size=100'),
    request<ApiMeter[]>('/meters'),
  ]);
  return {
    hotels: hotels.map(toHotel),
    rooms: rooms.map(toRoom),
    users: users.map(toUser),
    meters: meters.map(toMeter),
  };
}

export async function createHotel(payload: HotelCreatePayload): Promise<Hotel> {
  return toHotel(await request<ApiHotel>('/hotels', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export async function updateHotel(
  hotelId: number,
  hotel: Partial<Hotel>,
): Promise<Hotel> {
  const payload = {
    ...(hotel.name !== undefined ? { name: hotel.name } : {}),
    ...(hotel.address !== undefined ? { address: hotel.address } : {}),
    ...(hotel.city !== undefined ? { city: hotel.city } : {}),
    ...(hotel.country !== undefined ? { country: hotel.country } : {}),
    ...(hotel.contactNumber !== undefined ? { contact_number: hotel.contactNumber } : {}),
    ...(hotel.totalRooms !== undefined ? { total_rooms: hotel.totalRooms } : {}),
  };
  return toHotel(await request<ApiHotel>(`/hotels/${hotelId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }));
}

export function deleteHotel(hotelId: number): Promise<void> {
  return request<void>(`/hotels/${hotelId}`, { method: 'DELETE' });
}

export async function createUser(
  hotelId: number,
  user: Omit<User, 'id'>,
): Promise<User> {
  const created = await request<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify({
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      other_info: user.otherInfo,
      role: user.role,
      hotel_id: hotelId,
    }),
  });
  return toUser(created);
}

export function deleteUser(userId: number): Promise<void> {
  return request<void>(`/users/${userId}`, { method: 'DELETE' });
}

export async function createRoom(
  payload: RoomCreatePayload,
): Promise<{ room: Room; meter: ElectricityMeter }> {
  const room = toRoom(await request<ApiRoom>('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      hotel_id: payload.hotelId,
      room_number: payload.roomNumber,
      status: payload.status,
      floor: payload.floor,
      nightly_price: payload.pricePerNight,
      room_type: payload.roomType,
    }),
  }));
  const meter = toMeter(await request<ApiMeter>('/meters', {
    method: 'POST',
    body: JSON.stringify({ room_id: room.id, current_reading: 0, status: 'Active' }),
  }));
  return { room, meter };
}

export async function updateRoomStatus(
  roomId: number,
  status: Room['status'],
): Promise<Room> {
  return toRoom(await request<ApiRoom>(`/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }));
}

export function deleteRoom(roomId: number): Promise<void> {
  return request<void>(`/rooms/${roomId}?delete_meter=true`, { method: 'DELETE' });
}

export async function saveMeterReading(
  roomId: number,
  reading: number,
): Promise<ElectricityMeter> {
  return toMeter(await request<ApiMeter>('/meters', {
    method: 'POST',
    body: JSON.stringify({ room_id: roomId, current_reading: reading, status: 'Active' }),
  }));
}

export async function login(username: string) {
  return request<{
    user_id: number;
    username: string;
    role: User['role'];
    hotel_id?: number;
  }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}
