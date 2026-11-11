import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { AdminView } from './components/AdminView';
import { FrontDeskView, PropertyManagerView, MaintenanceEngineerView } from './components/RoleViews';
import { GuestView } from './components/GuestView';
import { CreateHotelModal } from './components/CreateHotelModal';
import {
  Hotel,
  Room,
  User,
  ElectricityMeter,
  UserLoginSession,
  HotelCreatePayload,
  SignupPayload,
  UserCreatePayload,
  UserUpdatePayload,
  BookingReservation,
  formatRole,
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
  signup as signupBackend,
  logout as logoutBackend,
  getStoredSession,
  connectUserEmail,
  sendTestEmail,
  saveMeterReading,
  updateHotel as updateBackendHotel,
  updateRoomStatus,
  updateUser as updateBackendUser,
} from './api';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [meters, setMeters] = useState<ElectricityMeter[]>([]);

  // Authenticated session state: restored from localStorage or null (requires login)
  const [session, setSession] = useState<UserLoginSession | null>(getStoredSession());

  const [currentTab, setCurrentTab] = useState<string>(getStoredSession() ? 'role-view' : 'login');
  const [isCreateHotelOpen, setIsCreateHotelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshBackendData = async () => {
    try {
      const data = await loadBackendData();
      setHotels(data.hotels);
      setRooms(data.rooms);
      setUsers(data.users);
      setMeters(data.meters);
      setBackendError(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown backend error';
      setBackendError(`Could not refresh backend data: ${message}`);
    }
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
        setBackendError(`Could not load property data: ${message}`);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLoginSubmit = async (
    usernameOrEmail: string,
    password?: string,
  ): Promise<UserLoginSession> => {
    const userSession = await loginBackend(usernameOrEmail, password);
    setSession(userSession);
    setCurrentTab('role-view');
    showToast(`Welcome, @${userSession.username} (${formatRole(userSession.role)})`);
    return userSession;
  };

  const handleSignupSubmit = async (payload: SignupPayload): Promise<UserLoginSession> => {
    const userSession = await signupBackend(payload);
    setSession(userSession);
    setCurrentTab('role-view');
    await refreshBackendData();
    showToast(`Account created successfully for @${userSession.username}!`);
    return userSession;
  };

  const handleLogout = () => {
    logoutBackend();
    setSession(null);
    setCurrentTab('login');
    showToast('Signed out of session.');
  };

  const handleCreateHotel = async (payload: HotelCreatePayload): Promise<Hotel> => {
    try {
      const hotel = await createBackendHotel(payload);
      setHotels((current) => [...current, hotel]);
      setBackendError(null);
      showToast(`Hotel "${hotel.name}" created successfully`);
      return hotel;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create hotel');
      throw error;
    }
  };

  const handleUpdateHotel = async (hotelId: number, data: Partial<Hotel>) => {
    try {
      const updatedHotel = await updateBackendHotel(hotelId, data);
      setHotels((current) => current.map((hotel) => (hotel.id === hotelId ? updatedHotel : hotel)));
      showToast(`Hotel #${hotelId} updated successfully`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update hotel');
      throw error;
    }
  };

  const handleDeleteHotel = async (hotelId: number) => {
    if (!confirm('Are you sure you want to permanently delete this hotel and all associated rooms and staff assignments?')) return;
    try {
      await deleteBackendHotel(hotelId);
      await refreshBackendData();
      showToast(`Hotel #${hotelId} and associated records were deleted`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete hotel');
    }
  };

  const handleAddUserToHotel = async (hotelId: number, userData: UserCreatePayload) => {
    try {
      const user = await createBackendUser(hotelId, userData);
      setUsers((current) => [...current, user]);
      showToast(`Staff member @${user.username} created successfully`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create user');
      throw error;
    }
  };

  const handleUpdateUser = async (userId: number, payload: UserUpdatePayload) => {
    try {
      const updated = await updateBackendUser(userId, payload);
      setUsers((current) => current.map((u) => (u.id === userId ? updated : u)));
      showToast(`Staff member @${updated.username} updated successfully`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update user');
      throw error;
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await deleteBackendUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
      showToast(`User #${userId} was deleted`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete user');
    }
  };

  const handleConnectEmail = async (userId: number, email: string) => {
    try {
      const updated = await connectUserEmail(userId, email);
      setUsers((current) => current.map((u) => (u.id === userId ? updated : u)));
      showToast(`Email updated for @${updated.username}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not connect email');
    }
  };

  const handleSendTestEmail = async (email: string, username: string) => {
    return sendTestEmail(email, username);
  };

  const handleAddRoomToHotel = async (
    hotelId: number,
    roomNumber: number,
    status: Room['status'],
  ): Promise<Room> => {
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
      showToast(`Room ${roomNumber} added to inventory`);
      return room;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create room');
      throw error;
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room and its meter?')) return;
    try {
      await deleteBackendRoom(roomId);
      await refreshBackendData();
      showToast(`Room #${roomId} was deleted`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete room');
    }
  };

  const handleRoomStatusChange = async (roomId: number, status: Room['status']) => {
    try {
      const updatedRoom = await updateRoomStatus(roomId, status);
      setRooms((current) => current.map((room) => (room.id === roomId ? updatedRoom : room)));
      showToast(`Room #${roomId} status updated`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update room status');
    }
  };

  const handleUpdateMeterReading = async (
    roomId: number,
    reading: number,
    status: 'Active' | 'Inactive' = 'Active',
  ) => {
    try {
      const meter = await saveMeterReading(roomId, reading, status);
      setMeters((current) => [
        ...current.filter((existing) => existing.roomId !== roomId),
        meter,
      ]);
      showToast(`Room #${roomId} meter logged: ${reading.toFixed(1)} kWh (${status})`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update meter');
      throw error;
    }
  };

  const handleBookRoom = async (
    roomId: number,
    bookingData: {
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      checkInDate: string;
      nights: number;
      totalPrice: number;
      specialRequests?: string;
    },
  ): Promise<BookingReservation> => {
    try {
      const updatedRoom = await updateRoomStatus(roomId, 'OCCUPIED');
      setRooms((current) =>
        current.map((r) =>
          r.id === roomId
            ? {
                ...updatedRoom,
                guestName: bookingData.guestName,
                checkInDate: bookingData.checkInDate,
              }
            : r,
        ),
      );
      const hotel = hotels.find((h) => h.id === updatedRoom.hotelId);
      const reservation: BookingReservation = {
        id: `HM-${Date.now().toString().slice(-6)}`,
        roomId,
        hotelId: updatedRoom.hotelId,
        hotelName: hotel?.name || 'Hotel Property',
        roomNumber: updatedRoom.roomNumber,
        roomType: updatedRoom.roomType,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        checkInDate: bookingData.checkInDate,
        nights: bookingData.nights,
        totalPrice: bookingData.totalPrice,
        specialRequests: bookingData.specialRequests,
        createdAt: new Date().toISOString(),
      };
      showToast(`Reservation confirmed for Room ${updatedRoom.roomNumber}!`);
      return reservation;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not complete reservation');
      throw error;
    }
  };

  const handleCancelBooking = async (roomId: number, bookingId?: string) => {
    try {
      const updatedRoom = await updateRoomStatus(roomId, 'available');
      setRooms((current) =>
        current.map((r) =>
          r.id === roomId
            ? {
                ...updatedRoom,
                guestName: undefined,
                checkInDate: undefined,
              }
            : r,
        ),
      );
      showToast(`Reservation cancelled. Room ${updatedRoom.roomNumber} is now available.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not cancel reservation');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar with Responsive Percentage Width */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onLogout={handleLogout}
        onOpenCreateHotel={() => setIsCreateHotelOpen(true)}
      />

      {/* Main Container with Percentage-based Window Sizing: w-[94%] sm:w-[92%] lg:w-[88%] */}
      <main className="flex-1 w-[94%] sm:w-[92%] lg:w-[88%] max-w-7xl mx-auto py-8">
        {backendError && (
          <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {backendError}
          </div>
        )}

        {!session || currentTab === 'login' ? (
          <LoginPage
            hotels={hotels}
            onLogin={handleLoginSubmit}
            onSignup={handleSignupSubmit}
          />
        ) : session.role === 'GUEST' ? (
          <GuestView
            session={session}
            hotels={hotels}
            rooms={rooms}
            onBookRoom={handleBookRoom}
            onCancelBooking={handleCancelBooking}
          />
        ) : (
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
                onUpdateUser={handleUpdateUser}
                onConnectEmail={handleConnectEmail}
                onSendTestEmail={handleSendTestEmail}
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
        )}
      </main>

      {/* Footer with Responsive Percentage Width */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-xs text-slate-500">
        <div className="w-[94%] sm:w-[92%] lg:w-[88%] max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-400">Hotel Manager Enterprise</span>
            <span>•</span>
            <span className={backendError ? 'text-rose-400' : 'text-emerald-400'}>
              {backendError ? 'Service Disconnected' : 'Systems Operational'}
            </span>
            <span>•</span>
            <span>Production v1.0</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} Hotel Manager Enterprise. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Create Hotel Modal with Percentage-based Sizing */}
      <CreateHotelModal
        isOpen={isCreateHotelOpen}
        onClose={() => setIsCreateHotelOpen(false)}
        onSubmit={handleCreateHotel}
      />
    </div>
  );
};
