import React, { useEffect, useState } from 'react';
import { Hotel, Room, User, UserCreatePayload, UserUpdatePayload, formatRole } from '../types';
import {
  Building2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Mail,
  Send,
  Edit2,
  CheckCircle2,
  Lock,
  BedDouble,
  UserPlus,
} from 'lucide-react';

interface AdminViewProps {
  hotels: Hotel[];
  rooms: Room[];
  users: User[];
  onOpenCreateHotel: () => void;
  onUpdateHotel: (hotelId: number, data: Partial<Hotel>) => Promise<void>;
  onAddUserToHotel: (hotelId: number, user: UserCreatePayload) => Promise<void>;
  onAddRoomToHotel: (hotelId: number, roomNumber: number, status: Room['status']) => Promise<void>;
  onDeleteHotel: (hotelId: number) => Promise<void>;
  onDeleteRoom: (roomId: number) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
  onUpdateUser?: (userId: number, data: UserUpdatePayload) => Promise<void>;
  onConnectEmail?: (userId: number, email: string) => Promise<void>;
  onSendTestEmail?: (email: string, username: string) => Promise<any>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  hotels,
  rooms,
  users,
  onOpenCreateHotel,
  onUpdateHotel,
  onAddUserToHotel,
  onAddRoomToHotel,
  onDeleteHotel,
  onDeleteRoom,
  onDeleteUser,
  onUpdateUser,
  onSendTestEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Manage Hotel Modal state
  const [managedHotel, setManagedHotel] = useState<Hotel | null>(null);
  const [activeManageTab, setActiveManageTab] = useState<'details' | 'addUser' | 'addRoom' | 'update'>('details');

  // Edit Hotel Form state
  const [editForm, setEditForm] = useState<{
    name: string;
    address: string;
    city: string;
    state: string;
    contactNumber: string;
    totalRooms: number;
  }>({
    name: '',
    address: '',
    city: '',
    state: '',
    contactNumber: '',
    totalRooms: 0,
  });

  // Add User Form with Password state
  const [newUserForm, setNewUserForm] = useState<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: User['role'];
  }>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'FRONT_DESK',
  });

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<{
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: User['role'];
  }>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'FRONT_DESK',
  });

  const [newRoomNumber, setNewRoomNumber] = useState<number>(101);
  const [newRoomStatus, setNewRoomStatus] = useState<Room['status']>('available');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState<number | null>(null);

  useEffect(() => {
    if (!managedHotel) return;
    const latestHotel = hotels.find((hotel) => hotel.id === managedHotel.id);
    setManagedHotel(latestHotel ?? null);
  }, [hotels, managedHotel?.id]);

  const filteredHotels = hotels.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      (h.city && h.city.toLowerCase().includes(q)) ||
      (h.state && h.state.toLowerCase().includes(q)) ||
      (h.contactNumber && h.contactNumber.includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / pageSize));
  const paginatedHotels = filteredHotels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openManageHotel = (hotel: Hotel) => {
    setActionError('');
    setActionNotice('');
    setManagedHotel(hotel);
    setEditForm({
      name: hotel.name,
      address: hotel.address,
      city: hotel.city || '',
      state: hotel.state || '',
      contactNumber: hotel.contactNumber || '',
      totalRooms: hotel.totalRooms,
    });
    setActiveManageTab('details');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedHotel) return;
    setActionError('');
    try {
      await onUpdateHotel(managedHotel.id, {
        name: editForm.name,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        contactNumber: editForm.contactNumber,
        totalRooms: Number(editForm.totalRooms),
      });
      setManagedHotel({
        ...managedHotel,
        name: editForm.name,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        contactNumber: editForm.contactNumber,
        totalRooms: Number(editForm.totalRooms),
      });
      setActionNotice('Property information successfully updated.');
      setActiveManageTab('details');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update hotel');
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedHotel) return;
    setActionError('');
    try {
      await onAddUserToHotel(managedHotel.id, {
        username: newUserForm.username.trim(),
        email: newUserForm.email.trim() || undefined,
        password: newUserForm.password.trim() || undefined,
        firstName: newUserForm.firstName.trim(),
        lastName: newUserForm.lastName.trim(),
        role: newUserForm.role,
        hotelId: managedHotel.id,
      });
      setNewUserForm({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'FRONT_DESK',
      });
      setActionNotice(
        `Staff member created with password and connected to Resend${newUserForm.email ? ` at ${newUserForm.email}` : ''}. You can now test logging in with their credentials!`,
      );
      setActiveManageTab('details');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not create user');
    }
  };

  const openEditUserModal = (u: User) => {
    setActionError('');
    setActionNotice('');
    setEditingUser(u);
    setEditUserForm({
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email || '',
      password: '',
      role: u.role,
    });
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !onUpdateUser) return;
    setActionError('');
    try {
      await onUpdateUser(editingUser.id, {
        username: editUserForm.username.trim(),
        firstName: editUserForm.firstName.trim(),
        lastName: editUserForm.lastName.trim(),
        email: editUserForm.email.trim() || undefined,
        role: editUserForm.role,
        password: editUserForm.password.trim() ? editUserForm.password.trim() : undefined,
      });
      setActionNotice(`User @${editUserForm.username} updated successfully.`);
      setEditingUser(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update user');
    }
  };

  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedHotel) return;
    setActionError('');
    try {
      await onAddRoomToHotel(managedHotel.id, Number(newRoomNumber), newRoomStatus);
      setNewRoomNumber((prev) => prev + 1);
      setActionNotice(`Room ${newRoomNumber} added to inventory.`);
      setActiveManageTab('details');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not create room');
    }
  };

  const handleTriggerTestEmail = async (user: User) => {
    if (!user.email || !onSendTestEmail) return;
    setIsSendingEmail(user.id);
    setActionNotice('');
    setActionError('');
    try {
      const res = await onSendTestEmail(user.email, user.username);
      setActionNotice(`Test email dispatched to ${user.email} (${res.status || 'sent'}).`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setIsSendingEmail(null);
    }
  };

  const hotelRooms = managedHotel ? rooms.filter((r) => r.hotelId === managedHotel.id) : [];
  const hotelUsers = managedHotel ? users.filter((u) => u.hotelId === managedHotel.id) : [];

  return (
    <div className="space-y-6 w-full">
      {/* 1. Top Header with CSS Flex Wrapping & Fixed Box Sizing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Administrator Console
            </span>
            <span className="text-xs text-slate-400">• Operations Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Property & Staff Management
          </h1>
          <p className="text-xs text-slate-400">
            Manage properties, room configurations, and staff members across all locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenCreateHotel}
            className="inline-flex items-center justify-center min-w-[170px] h-10 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 shrink-0 box-border"
          >
            <Plus className="w-4 h-4 stroke-[2.5] mr-1.5" />
            <span>Create New Hotel</span>
          </button>
        </div>
      </div>

      {/* 2. Hotel List Table with Search & Pagination */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by hotel name, address, state/province..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="text-xs text-slate-400">
            Total Properties: <strong className="text-white">{filteredHotels.length}</strong>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Hotel Name</th>
                <th className="py-3 px-4">Address & Location</th>
                <th className="py-3 px-4 text-center">Total Rooms</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {paginatedHotels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No hotels matching query.
                  </td>
                </tr>
              ) : (
                paginatedHotels.map((h) => {
                  const actualRoomCount = rooms.filter((r) => r.hotelId === h.id).length;
                  const locationString = [h.address, h.city, h.state, h.country]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0">
                            {h.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">{h.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {h.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{locationString}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 font-bold text-amber-400">
                          {h.totalRooms || actualRoomCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => openManageHotel(h)}
                            className="inline-flex items-center justify-center min-w-[80px] h-8 px-3 rounded-lg text-xs font-bold bg-slate-800 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition border border-amber-500/30 shrink-0 box-border"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => void onDeleteHotel(h.id)}
                            className="inline-flex items-center justify-center min-w-[80px] h-8 px-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition border border-rose-500/30 shrink-0 box-border"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center justify-center min-w-[70px] h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition shrink-0 box-border text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Prev</span>
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center justify-center min-w-[70px] h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition shrink-0 box-border text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Manage Hotel Modal with Percentage-based Window Sizing */}
      {managedHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[92%] sm:w-[84%] md:w-[74%] lg:w-[62%] max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  Property #{managedHotel.id}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{managedHotel.name}</h2>
              </div>
              <button
                onClick={() => setManagedHotel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Manage Tabs Bar with Fixed Button Sizing, Even Spacing & Flex Wrapping */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 border-b border-slate-800 bg-slate-950/70 px-5 py-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveManageTab('details')}
                className={`inline-flex items-center justify-center min-w-[130px] h-9 px-4 text-xs font-bold rounded-xl transition-all duration-150 shrink-0 ${
                  activeManageTab === 'details'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>Property Info</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveManageTab('addUser')}
                className={`inline-flex items-center justify-center min-w-[120px] h-9 px-4 text-xs font-bold rounded-xl transition-all duration-150 shrink-0 ${
                  activeManageTab === 'addUser'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>Add Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveManageTab('addRoom')}
                className={`inline-flex items-center justify-center min-w-[120px] h-9 px-4 text-xs font-bold rounded-xl transition-all duration-150 shrink-0 ${
                  activeManageTab === 'addRoom'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>Add Room</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveManageTab('update')}
                className={`inline-flex items-center justify-center min-w-[125px] h-9 px-4 text-xs font-bold rounded-xl transition-all duration-150 shrink-0 ${
                  activeManageTab === 'update'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>Update Info</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1">
              {actionError && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {actionError}
                </div>
              )}
              {actionNotice && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{actionNotice}</span>
                </div>
              )}

              {/* DETAILS TAB */}
              {activeManageTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Address & Location:</span>
                      <span className="font-semibold text-white">
                        {[managedHotel.address, managedHotel.city, managedHotel.state, managedHotel.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Contact Number:</span>
                      <span className="font-semibold text-white">
                        {managedHotel.contactNumber || 'Not specified'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Total Rooms Configured:</span>
                      <span className="font-bold text-amber-400 text-base">
                        {managedHotel.totalRooms}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Active Rooms in Inventory:</span>
                      <span className="font-bold text-emerald-400 text-base">
                        {hotelRooms.length}
                      </span>
                    </div>
                  </div>

                  {/* Users Assigned to this Hotel */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>Property Staff ({hotelUsers.length})</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 text-xs">
                      {hotelUsers.length === 0 ? (
                        <p className="text-slate-500">No staff members assigned to this property yet.</p>
                      ) : (
                        hotelUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {formatRole(u.role)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-amber-400/80" />
                                <span>{u.email || 'No email registered'}</span>
                              </div>
                            </div>

                            {/* Staff Action Buttons: Edit, Test Email, Delete */}
                            <div className="flex flex-wrap items-center gap-2">
                              {onUpdateUser && (
                                <button
                                  type="button"
                                  onClick={() => openEditUserModal(u)}
                                  className="inline-flex items-center justify-center min-w-[70px] h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20 transition shrink-0 box-border"
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {u.email && onSendTestEmail && (
                                <button
                                  type="button"
                                  disabled={isSendingEmail === u.id}
                                  onClick={() => handleTriggerTestEmail(u)}
                                  className="inline-flex items-center justify-center min-w-[120px] h-8 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition shrink-0 box-border"
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  <span>{isSendingEmail === u.id ? 'Sending...' : 'Send Test Email'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => void onDeleteUser(u.id)}
                                className="inline-flex items-center justify-center min-w-[70px] h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition shrink-0 box-border"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Rooms under this Hotel */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Rooms in this Property ({hotelRooms.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {hotelRooms.map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white block">Room {r.roomNumber}</span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                r.status === 'available'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : r.status === 'OCCUPIED'
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void onDeleteRoom(r.id)}
                            className="inline-flex items-center justify-center min-w-[65px] h-7 px-2 rounded-lg border border-rose-500/30 text-[10px] font-bold text-rose-300 hover:bg-rose-500/10 transition shrink-0 box-border"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ADD USER TAB */}
              {activeManageTab === 'addUser' && (
                <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
                  <p className="text-slate-400">
                    Register a new team member and configure their credentials and role permissions.
                  </p>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. sam_operations"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="Enter account password..."
                        value={newUserForm.password}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, password: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white pl-9"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Initial password used by this staff member to sign in.
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sam@example.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newUserForm.firstName}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, firstName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={newUserForm.lastName}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, lastName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Role *</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, role: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="FRONT_DESK">Front Desk</option>
                      <option value="PROPERTY_MANAGER">Property Manager</option>
                      <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="GUEST">Guest</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center min-w-[170px] h-10 px-5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 shrink-0 box-border"
                    >
                      Add Staff Member
                    </button>
                  </div>
                </form>
              )}

              {/* ADD ROOM TAB */}
              {activeManageTab === 'addRoom' && (
                <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
                  <p className="text-slate-400">
                    Add a room to <strong>{managedHotel.name}</strong> inventory.
                  </p>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Room Number *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Status *</label>
                    <select
                      value={newRoomStatus}
                      onChange={(e) => setNewRoomStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="available">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center min-w-[150px] h-10 px-5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 shrink-0 box-border"
                    >
                      Add Room
                    </button>
                  </div>
                </form>
              )}

              {/* UPDATE HOTEL TAB WITH STATE/PROVINCE */}
              {activeManageTab === 'update' && (
                <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Miami"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FL"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={editForm.contactNumber}
                        onChange={(e) =>
                          setEditForm({ ...editForm, contactNumber: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Total Rooms</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.totalRooms}
                        onChange={(e) =>
                          setEditForm({ ...editForm, totalRooms: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center min-w-[170px] h-10 px-5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 shrink-0 box-border"
                    >
                      Update Property
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit User Information Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[92%] sm:w-[80%] md:w-[65%] lg:w-[48%] max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  Staff Member #{editingUser.id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Edit Staff: @{editingUser.username}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.firstName}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, firstName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.lastName}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, lastName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.username}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, username: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. staff@example.com"
                  value={editUserForm.email}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing password..."
                  value={editUserForm.password}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, password: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Only enter a value if you wish to reset this user's password.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Role *</label>
                <select
                  value={editUserForm.role}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, role: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="FRONT_DESK">Front Desk</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="GUEST">Guest</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="inline-flex items-center justify-center min-w-[90px] h-9 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 box-border border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center min-w-[130px] h-9 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 shrink-0 box-border"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
