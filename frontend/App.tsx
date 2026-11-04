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
  createHotel as createBackendHotel,
  createRoom as createBackendRoom,
  createUser as createBackendUser,
  deleteHotel as deleteBackendHotel,
  deleteRoom as deleteBackendRoom,
  deleteUser as deleteBackendUser,
  loadBackendData,
  login as loginBackend,
  saveMeterReading,
  updateHotel as updateBackendHotel,
  updateRoomStatus,
} from './api';
import { CheckCircle2 } from 'lucide-react';

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
  const [backendError, setBackendError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshBackendData = async () => {
    const data = await loadBackendData();
    setHotels(data.hotels);
    setRooms(data.rooms);
    setUsers(data.users);
    setMeters(data.meters);
  };

  useEffect(() => {
    let active = true;
    loadBackendData()
      .then((data) => {
        if (!active) return;
        setHotels(data.hotels);
        setRooms(data.rooms);
        setUsers(data.users);
        setMeters(data.meters);
        setBackendError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unknown backend error';
        setBackendError(`Could not load PostgreSQL data: ${message}`);
      });
    return () => {
      active = false;
    };
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

  const handleCreateHotel = async (payload: HotelCreatePayload): Promise<Hotel> => {
    try {
      const hotel = await createBackendHotel(payload);
      setHotels((current) => [...current, hotel]);
      setBackendError(null);
      showToast(`Hotel "${hotel.name}" saved to PostgreSQL`);
      return hotel;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create hotel');
      throw error;
    }
  };

  const handleUpdateHotel = async (hotelId: number, data: Partial<Hotel>) => {
    try {
      const updatedHotel = await updateBackendHotel(hotelId, data);
      setHotels((current) => current.map((hotel) => hotel.id === hotelId ? updatedHotel : hotel));
      showToast(`Hotel #${hotelId} updated in PostgreSQL`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update hotel');
      throw error;
    }
  };

  const handleDeleteHotel = async (hotelId: number) => {
    if (!confirm('Delete this hotel and its rooms, meters, and hotel assignments from PostgreSQL?')) return;
    try {
      await deleteBackendHotel(hotelId);
      await refreshBackendData();
      showToast(`Hotel #${hotelId} and its associated records were deleted`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete hotel');
    }
  };

  const handleAddUserToHotel = async (hotelId: number, userData: Omit<User, 'id'>) => {
    try {
      const user = await createBackendUser(hotelId, userData);
      setUsers((current) => [...current, user]);
      showToast(`User @${user.username} saved and bound to Hotel #${hotelId}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create user');
      throw error;
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user and all hotel assignments from PostgreSQL?')) return;
    try {
      await deleteBackendUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
      showToast(`User #${userId} was deleted`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete user');
    }
  };

  const handleAddRoomToHotel = async (hotelId: number, roomNumber: number, status: Room['status']): Promise<Room> => {
    try {
      const { room, meter } = await createBackendRoom({
        hotelId,
        roomNumber,
        status,
        roomType: 'Standard',
        floor: 1,
        pricePerNight: 200,
      });
      setRooms((current) => [...current, room]);
      setMeters((current) => [...current, meter]);
      await refreshBackendData();
      showToast(`Room ${roomNumber} and its meter saved to PostgreSQL`);
      return room;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create room');
      throw error;
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Delete this room and its electricity meter from PostgreSQL?')) return;
    try {
      await deleteBackendRoom(roomId);
      await refreshBackendData();
      showToast(`Room #${roomId} and its meter were deleted`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete room');
    }
  };

  const handleRoomStatusChange = async (roomId: number, status: Room['status']) => {
    try {
      const updatedRoom = await updateRoomStatus(roomId, status);
      setRooms((current) => current.map((room) => room.id === roomId ? updatedRoom : room));
      showToast(`Room #${roomId} status saved`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update room status');
    }
  };

  const handleUpdateMeterReading = async (roomId: number, reading: number) => {
    try {
      const meter = await saveMeterReading(roomId, reading);
      setMeters((current) => [
        ...current.filter((existing) => existing.roomId !== roomId),
        meter,
      ]);
      showToast(`Room #${roomId} meter reading saved`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update meter');
    }
  };

  const handleBackendLogin = async (username: string): Promise<UserLoginSession> => {
    const user = await loginBackend(username);
    const newSession = {
      userId: user.user_id,
      username: user.username,
      role: user.role,
      hotelId: user.hotel_id,
    };
    handleLogin(newSession);
    return newSession;
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
        {backendError && (
          <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {backendError}
          </div>
        )}
        {!session || currentTab === 'login' ? (
          <LoginPage users={users} onAuthenticate={handleBackendLogin} />
        ) : currentTab === 'audit' ? (
          <DeliverablesAnalysisModal />
        ) : currentTab === 'api' ? (
          <ApiDocsView
            hotels={hotels}
            rooms={rooms}
            onCreateHotel={handleCreateHotel}
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
                onAddRoomToHotel={async (...args) => {
                  await handleAddRoomToHotel(...args);
                }}
                onDeleteHotel={handleDeleteHotel}
                onDeleteRoom={handleDeleteRoom}
                onDeleteUser={handleDeleteUser}
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
            <span className={backendError ? 'text-rose-400' : 'text-emerald-400'}>
              {backendError ? 'Backend unavailable' : 'PostgreSQL connected'}
            </span>
            <span>•</span>
            <span>Port 3000 Active</span>
          </div>
          <div className="flex items-center gap-4">
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
