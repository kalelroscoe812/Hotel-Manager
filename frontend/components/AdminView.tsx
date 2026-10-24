import React, { useState } from 'react';
import { Hotel, Room, User } from '../types';
import {
  Building2,
  Plus,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  BedDouble,
  Edit,
  MapPin,
  Phone,
  CheckCircle2,
} from 'lucide-react';

interface AdminViewProps {
  hotels: Hotel[];
  rooms: Room[];
  users: User[];
  onOpenCreateHotel: () => void;
  onUpdateHotel: (hotelId: number, data: Partial<Hotel>) => void;
  onAddUserToHotel: (hotelId: number, user: Omit<User, 'id'>) => void;
  onAddRoomToHotel: (hotelId: number, roomNumber: number, status: Room['status']) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  hotels,
  rooms,
  users,
  onOpenCreateHotel,
  onUpdateHotel,
  onAddUserToHotel,
  onAddRoomToHotel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Manage Hotel Modal state
  const [managedHotel, setManagedHotel] = useState<Hotel | null>(null);
  const [activeManageTab, setActiveManageTab] = useState<'details' | 'addUser' | 'addRoom' | 'update'>('details');

  // Forms in Manage Modal
  const [editForm, setEditForm] = useState<{ name: string; address: string; contactNumber: string; totalRooms: number }>({
    name: '',
    address: '',
    contactNumber: '',
    totalRooms: 0,
  });

  const [newUserForm, setNewUserForm] = useState<{
    username: string;
    firstName: string;
    lastName: string;
    role: User['role'];
  }>({
    username: '',
    firstName: '',
    lastName: '',
    role: 'FRONT_DESK',
  });

  const [newRoomNumber, setNewRoomNumber] = useState<number>(101);
  const [newRoomStatus, setNewRoomStatus] = useState<Room['status']>('available');

  const filteredHotels = hotels.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      (h.contactNumber && h.contactNumber.includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / pageSize));
  const paginatedHotels = filteredHotels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openManageHotel = (hotel: Hotel) => {
    setManagedHotel(hotel);
    setEditForm({
      name: hotel.name,
      address: hotel.address,
      contactNumber: hotel.contactNumber || '',
      totalRooms: hotel.totalRooms,
    });
    setActiveManageTab('details');
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedHotel) return;
    onUpdateHotel(managedHotel.id, {
      name: editForm.name,
      address: editForm.address,
      contactNumber: editForm.contactNumber,
      totalRooms: Number(editForm.totalRooms),
    });
    setManagedHotel({
      ...managedHotel,
      name: editForm.name,
      address: editForm.address,
      contactNumber: editForm.contactNumber,
      totalRooms: Number(editForm.totalRooms),
    });
    setActiveManageTab('details');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedHotel) return;
    onAddUserToHotel(managedHotel.id, {
      username: newUserForm.username,
      firstName: newUserForm.firstName,
      lastName: newUserForm.lastName,
      role: newUserForm.role,
      hotelId: managedHotel.id,
    });
    setNewUserForm({
      username: '',
      firstName: '',
      lastName: '',
      role: 'FRONT_DESK',
    });
    setActiveManageTab('details');
  };

  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedHotel) return;
    onAddRoomToHotel(managedHotel.id, Number(newRoomNumber), newRoomStatus);
    setNewRoomNumber((prev) => prev + 1);
    setActiveManageTab('details');
  };

  const hotelRooms = managedHotel ? rooms.filter((r) => r.hotelId === managedHotel.id) : [];
  const hotelUsers = managedHotel ? users.filter((u) => u.hotelId === managedHotel.id) : [];

  return (
    <div className="space-y-6">
      {/* 1. Show a button at top to create a new hotel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              ROLE: ADMIN VIEW
            </span>
            <span className="text-xs text-slate-400">• Full System Authority</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hotel Administration Console
          </h1>
          <p className="text-xs text-slate-400">
            Compliant with assignment technical specifications: Create Hotel, Table with Search & Pagination, Manage Hotel Details
          </p>
        </div>

        <button
          onClick={onOpenCreateHotel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Hotel</span>
        </button>
      </div>

      {/* 2. Show a table with the hotel list (table should have search and pagination feature) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by hotel name or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="text-xs text-slate-400">
            Total Hotels: <strong className="text-white">{filteredHotels.length}</strong>
          </div>
        </div>

        {/* The Exact Table Specification: HOTEL NAME | ADDRESS | TOTAL ROOMS | MANAGE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Hotel Name</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Total Rooms</th>
                <th className="py-3 px-4 text-right">Manage</th>
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
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
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
                          <span>{h.address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 font-bold text-amber-400">
                          {h.totalRooms || actualRoomCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openManageHotel(h)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition border border-amber-500/30"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. On Manage Click Modal (Show details, Add user, Add room, Update hotel) */}
      {managedHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  Manage Hotel #{managedHotel.id}
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

            {/* Manage Tabs matching assignment: Details | Add User | Add Room | Update Hotel */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2">
              <button
                onClick={() => setActiveManageTab('details')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                  activeManageTab === 'details'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Hotel Details
              </button>
              <button
                onClick={() => setActiveManageTab('addUser')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                  activeManageTab === 'addUser'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Add User
              </button>
              <button
                onClick={() => setActiveManageTab('addRoom')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                  activeManageTab === 'addRoom'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Add Room
              </button>
              <button
                onClick={() => setActiveManageTab('update')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                  activeManageTab === 'update'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Update Hotel
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* DETAILS TAB */}
              {activeManageTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block mb-1">Address:</span>
                      <span className="font-semibold text-white">{managedHotel.address}</span>
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
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Staff Assigned to this Hotel ({hotelUsers.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {hotelUsers.length === 0 ? (
                        <p className="text-slate-500 col-span-2">No users assigned yet.</p>
                      ) : (
                        hotelUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-white block">
                                {u.firstName} {u.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {u.role}
                            </span>
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                      {hotelRooms.map((r) => (
                        <div
                          key={r.id}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center"
                        >
                          <span className="font-bold text-white block">Room {r.roomNumber}</span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              r.status === 'available'
                                ? 'text-emerald-400'
                                : r.status === 'OCCUPIED'
                                ? 'text-blue-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {r.status}
                          </span>
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
                    Register a new staff member or manager and bind them directly to{' '}
                    <strong>{managedHotel.name}</strong>.
                  </p>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. frontdesk_sam"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newUserForm.firstName}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, firstName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    >
                      <option value="FRONT_DESK">FRONT_DESK</option>
                      <option value="PROPERTY_MANAGER">PROPERTY_MANAGER</option>
                      <option value="MAINTENANCE_ENGINEER">MAINTENANCE_ENGINEER</option>
                      <option value="GUEST">GUEST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                  >
                    Save & Bind User to Hotel
                  </button>
                </form>
              )}

              {/* ADD ROOM TAB */}
              {activeManageTab === 'addRoom' && (
                <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
                  <p className="text-slate-400">
                    Add a room record to <strong>{managedHotel.name}</strong> inventory.
                  </p>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Room Number *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Status *</label>
                    <select
                      value={newRoomStatus}
                      onChange={(e) => setNewRoomStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    >
                      <option value="available">available</option>
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                  >
                    Save Room to Hotel
                  </button>
                </form>
              )}

              {/* UPDATE HOTEL TAB */}
              {activeManageTab === 'update' && (
                <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={editForm.contactNumber}
                        onChange={(e) =>
                          setEditForm({ ...editForm, contactNumber: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                  >
                    Update Hotel Information
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
