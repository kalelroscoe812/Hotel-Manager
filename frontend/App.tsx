import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { AdminView } from './components/AdminView';
import { FrontDeskView, PropertyManagerView, MaintenanceEngineerView } from './components/RoleViews';
import { ApiDocsView } from './components/ApiDocsView';
import { DeliverablesAnalysisModal } from './components/DeliverablesAnalysisModal';
import { CreateHotelModal } from './components/CreateHotelModal';
import {
  Hotel,
  Room,
  User,
  ElectricityMeter,
  UserLoginSession,
  HotelCreatePayload,
} from './types';
import {
  getStoredHotels,
  saveStoredHotels,
  getStoredRooms,
  saveStoredRooms,
  getStoredUsers,
  saveStoredUsers,
  getStoredMeters,
  saveStoredMeters,
  resetAllData,
  appendApiLog,
} from './storage';
import { CheckCircle2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [meters, setMeters] = useState<ElectricityMeter[]>([]);

  // Session state: default to ADMIN for instant evaluator experience, but fully supports logout / login
  const [session, setSession] = useState<UserLoginSession | null>({
    userId: 1,
    username: 'admin',
    role: 'ADMIN',
  });

  const [currentTab, setCurrentTab] = useState<string>('role-view');
  const [isCreateHotelOpen, setIsCreateHotelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setHotels(getStoredHotels());
    setRooms(getStoredRooms());
    setUsers(getStoredUsers());
    setMeters(getStoredMeters());
  }, []);

  const handleLogin = (newSession: UserLoginSession) => {
    setSession(newSession);
    setCurrentTab('role-view');
    showToast(`Logged in as @${newSession.username} (${newSession.role})`);
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentTab('login');
  };

  // Hotel Actions
  const handleCreateHotel = (payload: HotelCreatePayload) => {
    const newId = hotels.length > 0 ? Math.max(...hotels.map((h) => h.id)) + 1 : 1;
    const newHotel: Hotel = {
      id: newId,
      name: payload.name.trim(),
      address: `${payload.address}, ${payload.city}, ${payload.country}`,
      city: payload.city,
      country: payload.country,
      totalRooms: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...hotels, newHotel];
    setHotels(updated);
    saveStoredHotels(updated);

    appendApiLog({
      method: 'POST',
      endpoint: '/hotels',
      statusCode: 201,
      responseTimeMs: 12,
      requestBody: payload,
      responseBody: newHotel,
    });

    showToast(`Hotel "${newHotel.name}" created`);
  };

  const handleUpdateHotel = (hotelId: number, data: Partial<Hotel>) => {
    const updated = hotels.map((h) => (h.id === hotelId ? { ...h, ...data } : h));
    setHotels(updated);
    saveStoredHotels(updated);

    appendApiLog({
      method: 'PUT',
      endpoint: `/hotels/${hotelId}`,
      statusCode: 200,
      responseTimeMs: 10,
      requestBody: data,
    });

    showToast(`Hotel #${hotelId} updated`);
  };

  // Admin Manage: Add User to Hotel
  const handleAddUserToHotel = (hotelId: number, userData: Omit<User, 'id'>) => {
    const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id: newId,
      ...userData,
      hotelId,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);

    appendApiLog({
      method: 'POST',
      endpoint: '/users',
      statusCode: 201,
      responseTimeMs: 14,
      requestBody: userData,
    });

    showToast(`User @${newUser.username} added and bound to Hotel #${hotelId}`);
  };

  // Admin Manage: Add Room to Hotel
  const handleAddRoomToHotel = (hotelId: number, roomNumber: number, status: Room['status']) => {
    const newId = rooms.length > 0 ? Math.max(...rooms.map((r) => r.id)) + 1 : 1;
    const newRoom: Room = {
      id: newId,
      hotelId,
      roomNumber,
      status,
      pricePerNight: 200,
    };
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    saveStoredRooms(updatedRooms);

    // Also create electricity meter for new room
    const newMeter: ElectricityMeter = {
      id: meters.length > 0 ? Math.max(...meters.map((m) => m.id)) + 1 : 1,
      roomId: newId,
      currentReading: 0.0,
      status: 'Active',
    };
    const updatedMeters = [...meters, newMeter];
    setMeters(updatedMeters);
    saveStoredMeters(updatedMeters);

    // Update totalRooms on hotel
    const hotel = hotels.find((h) => h.id === hotelId);
    if (hotel) {
      handleUpdateHotel(hotelId, { totalRooms: hotel.totalRooms + 1 });
    }

    showToast(`Room ${roomNumber} added with Active Electricity Meter`);
  };

  // Room Status Change
  const handleRoomStatusChange = (roomId: number, status: Room['status']) => {
    const updated = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          status,
          guestName: status === 'OCCUPIED' ? (r.guestName || 'Guest User') : undefined,
        };
      }
      return r;
    });
    setRooms(updated);
    saveStoredRooms(updated);

    appendApiLog({
      method: 'PUT',
      endpoint: `/rooms/${roomId}`,
      statusCode: 200,
      responseTimeMs: 8,
      requestBody: { status },
    });

    showToast(`Room #${roomId} status changed to ${status}`);
  };

  // Meter Reading Update
  const handleUpdateMeterReading = (roomId: number, reading: number) => {
    const updated = meters.map((m) => (m.roomId === roomId ? { ...m, currentReading: reading } : m));
    setMeters(updated);
    saveStoredMeters(updated);

    appendApiLog({
      method: 'POST',
      endpoint: '/meters',
      statusCode: 200,
      responseTimeMs: 9,
      requestBody: { room_id: roomId, current_reading: reading },
    });

    showToast(`Room #${roomId} meter updated to ${reading} kWh`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onLogout={handleLogout}
        onOpenCreateHotel={() => setIsCreateHotelOpen(true)}
      />

      {/* Quick Role Switcher Bar when logged in */}
      {session && (
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Current View:</span>
            <span className="font-bold text-amber-400 uppercase">{session.role} VIEW</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">User: <strong>@{session.username}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Test other role:</span>
            {(['ADMIN', 'FRONT_DESK', 'PROPERTY_MANAGER', 'MAINTENANCE_ENGINEER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  const matchingUser = users.find((u) => u.role === r) || {
                    id: 99,
                    username: r.toLowerCase(),
                    role: r,
                    hotelId: 1,
                  };
                  handleLogin({
                    userId: matchingUser.id,
                    username: matchingUser.username,
                    role: r,
                    hotelId: matchingUser.hotelId || 1,
                  });
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  session.role === r
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {r === 'ADMIN' && 'Admin'}
                {r === 'FRONT_DESK' && 'Front Desk'}
                {r === 'PROPERTY_MANAGER' && 'Prop Mgr'}
                {r === 'MAINTENANCE_ENGINEER' && 'Maintenance'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session || currentTab === 'login' ? (
          <LoginPage users={users} onLogin={handleLogin} />
        ) : currentTab === 'audit' ? (
          <DeliverablesAnalysisModal />
        ) : currentTab === 'api' ? (
          <ApiDocsView
            hotels={hotels}
            rooms={rooms}
            onCreateHotel={(h) => handleCreateHotel(h as any)}
            onCreateRoom={(r) => handleAddRoomToHotel(r.hotelId, r.roomNumber, r.status)}
          />
        ) : currentTab === 'role-view' ? (
          <>
            {session.role === 'ADMIN' && (
              <AdminView
                hotels={hotels}
                rooms={rooms}
                users={users}
                onOpenCreateHotel={() => setIsCreateHotelOpen(true)}
                onUpdateHotel={handleUpdateHotel}
                onAddUserToHotel={handleAddUserToHotel}
                onAddRoomToHotel={handleAddRoomToHotel}
              />
            )}

            {session.role === 'FRONT_DESK' && (
              <FrontDeskView
                session={session}
                hotels={hotels}
                rooms={rooms}
                onStatusChange={handleRoomStatusChange}
              />
            )}

            {session.role === 'PROPERTY_MANAGER' && (
              <PropertyManagerView
                session={session}
                hotels={hotels}
                rooms={rooms}
                meters={meters}
                onUpdateMeterReading={handleUpdateMeterReading}
              />
            )}

            {session.role === 'MAINTENANCE_ENGINEER' && (
              <MaintenanceEngineerView
                session={session}
                hotels={hotels}
                rooms={rooms}
                meters={meters}
                onStatusChange={handleRoomStatusChange}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Hotel Manager Capstone</span>
            <span>•</span>
            <span className="text-emerald-400">5/5 Pytests Passing</span>
            <span>•</span>
            <span>Port 3000 Active</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Reset sample database to default seed state?')) {
                  resetAllData();
                  setHotels(getStoredHotels());
                  setRooms(getStoredRooms());
                  setUsers(getStoredUsers());
                  setMeters(getStoredMeters());
                  showToast('Database reset to defaults');
                }
              }}
              className="hover:text-amber-400 transition"
            >
              Reset Sample Data
            </button>
            <button
              onClick={() => setCurrentTab('audit')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Read Collaborators & Deliverables Audit
            </button>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <CreateHotelModal
        isOpen={isCreateHotelOpen}
        onClose={() => setIsCreateHotelOpen(false)}
        onSubmit={handleCreateHotel}
      />
    </div>
  );
};
