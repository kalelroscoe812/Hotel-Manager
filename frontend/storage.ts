import { Hotel, Room, User, ElectricityMeter, ApiRequestLog } from './types';

const HOTELS_KEY = 'hm_hotels_v2';
const ROOMS_KEY = 'hm_rooms_v2';
const USERS_KEY = 'hm_users_v2';
const METERS_KEY = 'hm_meters_v2';
const LOGS_KEY = 'hm_logs_v2';

const INITIAL_HOTELS: Hotel[] = [
  {
    id: 1,
    name: 'Harbor House',
    address: '1 Marina Way, Boston, USA',
    city: 'Boston',
    country: 'USA',
    contactNumber: '617-555-0199',
    totalRooms: 40,
    logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&auto=format&fit=crop&q=60',
  },
  {
    id: 2,
    name: 'Grand Alpine Lodge',
    address: '44 Mountain Peak Rd, Aspen, USA',
    city: 'Aspen',
    country: 'USA',
    contactNumber: '970-555-0142',
    totalRooms: 70,
    logo: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&auto=format&fit=crop&q=60',
  },
  {
    id: 3,
    name: 'Azure Bay Resort',
    address: '7 Ocean Boulevard, San Diego, USA',
    city: 'San Diego',
    country: 'USA',
    contactNumber: '619-555-0188',
    totalRooms: 55,
    logo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=100&auto=format&fit=crop&q=60',
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'ADMIN',
    otherInfo: 'Global Operations',
  },
  {
    id: 2,
    username: 'frontdesk_jane',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'FRONT_DESK',
    hotelId: 1,
    otherInfo: 'Morning Shift',
  },
  {
    id: 3,
    username: 'manager_mike',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'PROPERTY_MANAGER',
    hotelId: 1,
    otherInfo: 'General Manager',
  },
  {
    id: 4,
    username: 'engineer_bob',
    firstName: 'Bob',
    lastName: 'Miller',
    role: 'MAINTENANCE_ENGINEER',
    hotelId: 1,
    otherInfo: 'HVAC & Electrical Specialist',
  },
];

const INITIAL_ROOMS: Room[] = [
  { id: 1, hotelId: 1, roomNumber: 101, status: 'available', pricePerNight: 180 },
  { id: 2, hotelId: 1, roomNumber: 102, status: 'OCCUPIED', guestName: 'Eleanor Vance', pricePerNight: 240 },
  { id: 3, hotelId: 1, roomNumber: 201, status: 'available', pricePerNight: 350 },
  { id: 4, hotelId: 1, roomNumber: 202, status: 'Maintenance', pricePerNight: 190 },
  { id: 5, hotelId: 1, roomNumber: 301, status: 'OCCUPIED', guestName: 'Marcus Sterling', pricePerNight: 450 },
  { id: 6, hotelId: 2, roomNumber: 101, status: 'available', pricePerNight: 220 },
  { id: 7, hotelId: 2, roomNumber: 102, status: 'OCCUPIED', guestName: 'Sophia Lin', pricePerNight: 300 },
  { id: 8, hotelId: 3, roomNumber: 401, status: 'available', pricePerNight: 400 },
];

const INITIAL_METERS: ElectricityMeter[] = [
  { id: 1, roomId: 1, currentReading: 142.4, status: 'Active' },
  { id: 2, roomId: 2, currentReading: 388.9, status: 'Active' },
  { id: 3, roomId: 3, currentReading: 95.2, status: 'Active' },
  { id: 4, roomId: 4, currentReading: 512.6, status: 'Inactive' },
  { id: 5, roomId: 5, currentReading: 620.1, status: 'Active' },
  { id: 6, roomId: 6, currentReading: 110.8, status: 'Active' },
  { id: 7, roomId: 7, currentReading: 275.3, status: 'Active' },
  { id: 8, roomId: 8, currentReading: 418.0, status: 'Active' },
];

export function getStoredHotels(): Hotel[] {
  try {
    const raw = localStorage.getItem(HOTELS_KEY);
    if (!raw) {
      localStorage.setItem(HOTELS_KEY, JSON.stringify(INITIAL_HOTELS));
      return INITIAL_HOTELS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HOTELS;
  }
}

export function saveStoredHotels(hotels: Hotel[]): void {
  localStorage.setItem(HOTELS_KEY, JSON.stringify(hotels));
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getStoredRooms(): Room[] {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (!raw) {
      localStorage.setItem(ROOMS_KEY, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ROOMS;
  }
}

export function saveStoredRooms(rooms: Room[]): void {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function getStoredMeters(): ElectricityMeter[] {
  try {
    const raw = localStorage.getItem(METERS_KEY);
    if (!raw) {
      localStorage.setItem(METERS_KEY, JSON.stringify(INITIAL_METERS));
      return INITIAL_METERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_METERS;
  }
}

export function saveStoredMeters(meters: ElectricityMeter[]): void {
  localStorage.setItem(METERS_KEY, JSON.stringify(meters));
}

export function appendApiLog(log: Omit<ApiRequestLog, 'id' | 'timestamp'>): ApiRequestLog {
  const newLog: ApiRequestLog = {
    ...log,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOGS_KEY, JSON.stringify([newLog, ...existing].slice(0, 50)));
  } catch (e) {
    console.error(e);
  }
  return newLog;
}

export function resetAllData(): void {
  localStorage.setItem(HOTELS_KEY, JSON.stringify(INITIAL_HOTELS));
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(ROOMS_KEY, JSON.stringify(INITIAL_ROOMS));
  localStorage.setItem(METERS_KEY, JSON.stringify(INITIAL_METERS));
  localStorage.removeItem(LOGS_KEY);
}
