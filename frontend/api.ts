import {
  ElectricityMeter,
  Hotel,
  HotelCreatePayload,
  Room,
  RoomCreatePayload,
  SignupPayload,
  User,
  UserCreatePayload,
  UserLoginSession,
  UserUpdatePayload,
} from './types';

const API_BASE_URL = '/api';
const TOKEN_STORAGE_KEY = 'hotel_manager_token';
const SESSION_STORAGE_KEY = 'hotel_manager_session';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getStoredSession(): UserLoginSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserLoginSession) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: UserLoginSession | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (session.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
      }
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

interface ApiHotel {
  id: number;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
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
  email?: string | null;
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

interface AuthApiResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  email?: string | null;
  role: User['role'];
  hotel_id?: number | null;
  first_name?: string;
  last_name?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
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
  state: hotel.state ?? '',
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
  email: user.email ?? undefined,
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
  return toHotel(
    await request<ApiHotel>('/hotels', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        address: payload.address,
        city: payload.city,
        state: payload.state ?? '',
        country: payload.country,
      }),
    }),
  );
}

export async function updateHotel(
  hotelId: number,
  hotel: Partial<Hotel>,
): Promise<Hotel> {
  const payload = {
    ...(hotel.name !== undefined ? { name: hotel.name } : {}),
    ...(hotel.address !== undefined ? { address: hotel.address } : {}),
    ...(hotel.city !== undefined ? { city: hotel.city } : {}),
    ...(hotel.state !== undefined ? { state: hotel.state } : {}),
    ...(hotel.country !== undefined ? { country: hotel.country } : {}),
    ...(hotel.contactNumber !== undefined ? { contact_number: hotel.contactNumber } : {}),
    ...(hotel.totalRooms !== undefined ? { total_rooms: hotel.totalRooms } : {}),
  };
  return toHotel(
    await request<ApiHotel>(`/hotels/${hotelId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  );
}

export function deleteHotel(hotelId: number): Promise<void> {
  return request<void>(`/hotels/${hotelId}`, { method: 'DELETE' });
}

export async function createUser(
  hotelId: number,
  user: UserCreatePayload,
): Promise<User> {
  const created = await request<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify({
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      password: user.password,
      other_info: user.otherInfo,
      role: user.role,
      hotel_id: hotelId,
    }),
  });
  return toUser(created);
}

export async function updateUser(
  userId: number,
  payload: UserUpdatePayload,
): Promise<User> {
  const body: Record<string, any> = {};
  if (payload.username !== undefined) body.username = payload.username;
  if (payload.firstName !== undefined) body.first_name = payload.firstName;
  if (payload.lastName !== undefined) body.last_name = payload.lastName;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.password !== undefined && payload.password.trim() !== '') body.password = payload.password;
  if (payload.role !== undefined) body.role = payload.role;
  if (payload.otherInfo !== undefined) body.other_info = payload.otherInfo;
  if (payload.hotelId !== undefined) body.hotel_id = payload.hotelId;

  const updated = await request<ApiUser>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return toUser(updated);
}

export function deleteUser(userId: number): Promise<void> {
  return request<void>(`/users/${userId}`, { method: 'DELETE' });
}

export async function createRoom(
  payload: RoomCreatePayload,
): Promise<{ room: Room; meter: ElectricityMeter }> {
  const room = toRoom(
    await request<ApiRoom>('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        hotel_id: payload.hotelId,
        room_number: payload.roomNumber,
        status: payload.status,
        floor: payload.floor,
        nightly_price: payload.pricePerNight,
        room_type: payload.roomType,
      }),
    }),
  );
  const meter = toMeter(
    await request<ApiMeter>('/meters', {
      method: 'POST',
      body: JSON.stringify({ room_id: room.id, current_reading: 0, status: 'Active' }),
    }),
  );
  return { room, meter };
}

export async function updateRoomStatus(
  roomId: number,
  status: Room['status'],
): Promise<Room> {
  return toRoom(
    await request<ApiRoom>(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  );
}

export function deleteRoom(roomId: number): Promise<void> {
  return request<void>(`/rooms/${roomId}?delete_meter=true`, { method: 'DELETE' });
}

export async function saveMeterReading(
  roomId: number,
  reading: number,
  status: 'Active' | 'Inactive' = 'Active',
): Promise<ElectricityMeter> {
  return toMeter(
    await request<ApiMeter>('/meters', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, current_reading: reading, status }),
    }),
  );
}

// Authenticated Login via /auth/login or backwards-compatible /login
export async function login(usernameOrEmail: string, password?: string): Promise<UserLoginSession> {
  if (password) {
    const authData = await request<AuthApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username_or_email: usernameOrEmail,
        password,
      }),
    });
    const session: UserLoginSession = {
      userId: authData.user_id,
      username: authData.username,
      role: authData.role,
      email: authData.email ?? undefined,
      hotelId: authData.hotel_id ?? undefined,
      token: authData.access_token,
    };
    saveStoredSession(session);
    return session;
  }

  // Fallback endpoint
  const resp = await request<{
    user_id: number;
    username: string;
    role: User['role'];
    email?: string;
    hotel_id?: number;
    token?: string;
  }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username: usernameOrEmail }),
  });

  const session: UserLoginSession = {
    userId: resp.user_id,
    username: resp.username,
    role: resp.role,
    email: resp.email,
    hotelId: resp.hotel_id,
    token: resp.token,
  };
  saveStoredSession(session);
  return session;
}

// Signup new user or admin with password and Resend email connection
export async function signup(payload: SignupPayload): Promise<UserLoginSession> {
  const authData = await request<AuthApiResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      first_name: payload.firstName,
      last_name: payload.lastName,
      role: payload.role,
      hotel_id: payload.hotelId,
    }),
  });

  const session: UserLoginSession = {
    userId: authData.user_id,
    username: authData.username,
    role: authData.role,
    email: authData.email ?? undefined,
    hotelId: authData.hotel_id ?? undefined,
    token: authData.access_token,
  };
  saveStoredSession(session);
  return session;
}

export async function connectUserEmail(userId: number, email: string): Promise<User> {
  const updated = await request<ApiUser>(`/users/${userId}/connect-email`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return toUser(updated);
}

export async function sendTestEmail(email: string, username = 'User') {
  return request<{
    status: string;
    to: string;
    subject?: string;
    message?: string;
    error?: string;
  }>('/email/send-test', {
    method: 'POST',
    body: JSON.stringify({ email, username }),
  });
}

export function logout() {
  saveStoredSession(null);
}
