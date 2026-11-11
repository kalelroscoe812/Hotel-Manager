import React, { useState } from 'react';
import { Hotel, Room, ElectricityMeter, UserLoginSession } from '../types';
import {
  BedDouble,
  Zap,
  Wrench,
  CheckCircle2,
  Building2,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react';

// ================= FRONT DESK VIEW =================
interface FrontDeskViewProps {
  session: UserLoginSession;
  hotels: Hotel[];
  rooms: Room[];
  onStatusChange: (roomId: number, status: Room['status']) => void;
}

export const FrontDeskView: React.FC<FrontDeskViewProps> = ({
  session,
  hotels,
  rooms,
  onStatusChange,
}) => {
  const currentHotel = hotels.find((h) => h.id === session.hotelId) || hotels[0];
  const hotelRooms = rooms.filter((r) => r.hotelId === (currentHotel?.id || 1));
  const availableRooms = hotelRooms.filter((r) => r.status === 'available');
  const occupiedRooms = hotelRooms.filter((r) => r.status === 'OCCUPIED');
  const maintenanceRooms = hotelRooms.filter((r) => r.status === 'Maintenance');

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'available' | 'OCCUPIED' | 'Maintenance'>('ALL');

  const displayedRooms = hotelRooms.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Property Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Front Desk Operations
              </span>
              <span className="text-xs text-slate-400">
                • {currentHotel?.name || 'Property'} (@{session.username})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Guest Services & Room Turnover
            </h1>
            <p className="text-xs text-slate-400">
              Manage arrivals, departures, and guest room assignments.
            </p>
          </div>

          {/* Quick Filter Buttons with CSS Flex Wrapping & Fixed Box Sizes */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`inline-flex items-center justify-center min-w-[70px] h-8 px-3 rounded-lg text-xs font-bold transition shrink-0 box-border ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({hotelRooms.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`inline-flex items-center justify-center min-w-[100px] h-8 px-3 rounded-lg text-xs font-bold transition shrink-0 box-border ${
                statusFilter === 'available'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
              }`}
            >
              Available ({availableRooms.length})
            </button>
            <button
              onClick={() => setStatusFilter('OCCUPIED')}
              className={`inline-flex items-center justify-center min-w-[100px] h-8 px-3 rounded-lg text-xs font-bold transition shrink-0 box-border ${
                statusFilter === 'OCCUPIED'
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                  : 'bg-slate-950 text-blue-400 hover:bg-blue-500/10 border border-slate-800'
              }`}
            >
              Occupied ({occupiedRooms.length})
            </button>
            <button
              onClick={() => setStatusFilter('Maintenance')}
              className={`inline-flex items-center justify-center min-w-[110px] h-8 px-3 rounded-lg text-xs font-bold transition shrink-0 box-border ${
                statusFilter === 'Maintenance'
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                  : 'bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
              }`}
            >
              Maintenance ({maintenanceRooms.length})
            </button>
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs font-semibold">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[11px]">Ready for Check-In</span>
            <span className="text-xl font-bold text-emerald-400">{availableRooms.length}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[11px]">Currently Occupied</span>
            <span className="text-xl font-bold text-blue-400">{occupiedRooms.length}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[11px]">Under Maintenance</span>
            <span className="text-xl font-bold text-rose-400">{maintenanceRooms.length}</span>
          </div>
        </div>
      </div>

      {/* Rooms Grid with Fluid Percentage Widths */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedRooms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No rooms found matching filter.
          </div>
        ) : (
          displayedRooms.map((room) => (
            <div
              key={room.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-base">Room {room.roomNumber}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      room.status === 'available'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : room.status === 'OCCUPIED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
                {room.guestName && (
                  <div className="text-xs text-slate-300 mt-2">
                    Guest: <strong className="text-blue-300">{room.guestName}</strong>
                  </div>
                )}
                {room.pricePerNight && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    Rate: <span className="font-mono text-amber-300">${room.pricePerNight}/night</span>
                  </div>
                )}
              </div>

              {/* Button Spacing, Fixed Box Sizes, and CSS Flex Wrapping */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                {room.status === 'available' && (
                  <button
                    onClick={() => onStatusChange(room.id, 'OCCUPIED')}
                    className="w-full h-9 inline-flex items-center justify-center rounded-lg text-xs font-bold bg-blue-500 hover:bg-blue-400 text-slate-950 transition box-border shadow-sm"
                  >
                    Check In Guest
                  </button>
                )}
                {room.status === 'OCCUPIED' && (
                  <button
                    onClick={() => onStatusChange(room.id, 'available')}
                    className="w-full h-9 inline-flex items-center justify-center rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition box-border shadow-sm"
                  >
                    Check Out (Set Available)
                  </button>
                )}
                {room.status === 'Maintenance' && (
                  <button
                    onClick={() => onStatusChange(room.id, 'available')}
                    className="w-full h-9 inline-flex items-center justify-center rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition box-border shadow-sm"
                  >
                    Cleared from Maintenance
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ================= PROPERTY MANAGER VIEW =================
interface PropertyManagerViewProps {
  session: UserLoginSession;
  hotels: Hotel[];
  rooms: Room[];
  meters: ElectricityMeter[];
  onUpdateMeterReading: (roomId: number, reading: number, status?: 'Active' | 'Inactive') => Promise<void> | void;
}

export const PropertyManagerView: React.FC<PropertyManagerViewProps> = ({
  session,
  hotels,
  rooms,
  meters,
  onUpdateMeterReading,
}) => {
  const currentHotel = hotels.find((h) => h.id === session.hotelId) || hotels[0];
  const hotelRooms = rooms.filter((r) => r.hotelId === (currentHotel?.id || 1));
  const occupiedCount = hotelRooms.filter((r) => r.status === 'OCCUPIED').length;
  const occupancyPercent =
    hotelRooms.length > 0 ? Math.round((occupiedCount / hotelRooms.length) * 100) : 0;

  // Dedicated in-app modal state for logging meter readings
  const [activeMeterRoom, setActiveMeterRoom] = useState<Room | null>(null);
  const [readingInput, setReadingInput] = useState<number>(0);
  const [statusInput, setStatusInput] = useState<'Active' | 'Inactive'>('Active');
  const [isLogging, setIsLogging] = useState(false);
  const [logError, setLogError] = useState('');

  const handleOpenLogModal = (room: Room, meter?: ElectricityMeter) => {
    setActiveMeterRoom(room);
    setReadingInput(meter ? Number(meter.currentReading) : 0);
    setStatusInput(meter?.status || 'Active');
    setLogError('');
  };

  const handleSaveMeterReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeterRoom) return;
    if (isNaN(readingInput) || readingInput < 0) {
      setLogError('Reading must be a valid non-negative number.');
      return;
    }
    setIsLogging(true);
    setLogError('');
    try {
      await onUpdateMeterReading(activeMeterRoom.id, Number(readingInput), statusInput);
      setActiveMeterRoom(null);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : 'Failed to update meter reading');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Property Operations
          </span>
          <span className="text-xs text-slate-400">
            • {currentHotel?.name} (@{session.username})
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Property Performance & Utilities
        </h1>
        <p className="text-xs text-slate-400">
          Monitor occupancy rates and room electricity consumption in real time.
        </p>

        {/* Property Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Total Rooms</span>
            <span className="text-2xl font-bold text-white">
              {currentHotel?.totalRooms || hotelRooms.length}
            </span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Current Occupancy</span>
            <span className="text-2xl font-bold text-blue-400">{occupancyPercent}%</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              ({occupiedCount}/{hotelRooms.length} rooms)
            </span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Electricity Meters</span>
            <span className="text-2xl font-bold text-amber-400">{meters.length}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Active monitoring</span>
          </div>
        </div>
      </div>

      {/* Electricity Meters Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Room Electricity Meters & Telemetry</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Room Status</th>
                <th className="py-3 px-4">Current Reading (kWh)</th>
                <th className="py-3 px-4">Meter Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {hotelRooms.map((r) => {
                const meter = meters.find((m) => m.roomId === r.id);
                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white">Room {r.roomNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-950 border border-slate-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300 font-bold">
                      {meter ? `${meter.currentReading.toFixed(1)} kWh` : 'No meter'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          meter?.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : meter
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {meter?.status || 'Unregistered'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* Button Spacing, Fixed Box Sizes, and CSS Flex Wrapping */}
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenLogModal(r, meter)}
                          className={`inline-flex items-center justify-center min-w-[105px] h-8 px-3 rounded-lg text-xs font-semibold transition shrink-0 box-border border ${
                            meter
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
                          <span>{meter ? 'Log Reading' : 'Setup Meter'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Meter Reading Modal */}
      {activeMeterRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[92%] sm:w-[75%] md:w-[55%] lg:w-[40%] max-w-md overflow-hidden shadow-2xl p-6 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Log Electricity Meter</h3>
                  <span className="text-[11px] text-slate-400">
                    Room {activeMeterRoom.roomNumber} • {currentHotel?.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMeterRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {logError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {logError}
              </div>
            )}

            <form onSubmit={handleSaveMeterReading} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Meter Reading (kWh) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={readingInput}
                    onChange={(e) => setReadingInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-white font-mono text-sm pl-3 pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    kWh
                  </span>
                </div>
              </div>

              {/* Quick increment buttons */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Quick Add:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setReadingInput((prev) => Number((Number(prev) + amt).toFixed(1)))}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-mono transition"
                    >
                      +{amt} kWh
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Meter Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as 'Active' | 'Inactive')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Active">Active (Normal Operation)</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveMeterRoom(null)}
                  className="inline-flex items-center justify-center min-w-[85px] h-9 px-3 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLogging}
                  className="inline-flex items-center justify-center min-w-[130px] h-9 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition shadow-md shadow-amber-500/20 text-xs"
                >
                  {isLogging ? 'Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= MAINTENANCE ENGINEER VIEW =================
interface MaintenanceEngineerViewProps {
  session: UserLoginSession;
  hotels: Hotel[];
  rooms: Room[];
  meters: ElectricityMeter[];
  onStatusChange: (roomId: number, status: Room['status']) => void;
}

export const MaintenanceEngineerView: React.FC<MaintenanceEngineerViewProps> = ({
  session,
  hotels,
  rooms,
  meters,
  onStatusChange,
}) => {
  const currentHotel = hotels.find((h) => h.id === session.hotelId) || hotels[0];
  const hotelRooms = rooms.filter((r) => r.hotelId === (currentHotel?.id || 1));
  const maintenanceRooms = hotelRooms.filter((r) => r.status === 'Maintenance');

  return (
    <div className="space-y-6 w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            Facilities & Maintenance
          </span>
          <span className="text-xs text-slate-400">
            • {currentHotel?.name} (@{session.username})
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Maintenance & Work Orders
        </h1>
        <p className="text-xs text-slate-400">
          Track maintenance requests, room repairs, and operational readiness.
        </p>
      </div>

      {/* Maintenance Rooms */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-rose-400" />
          <span>Rooms Flagged for Maintenance ({maintenanceRooms.length})</span>
        </h2>

        {maintenanceRooms.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 shadow-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            No rooms currently under maintenance in {currentHotel?.name}. All rooms operational!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {maintenanceRooms.map((room) => {
              const meter = meters.find((m) => m.roomId === room.id);
              return (
                <div
                  key={room.id}
                  className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-bold text-white block">Room {room.roomNumber}</span>
                      <span className="text-xs text-rose-400 font-semibold">Under Maintenance</span>
                    </div>
                    <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400">Electricity Meter:</div>
                    <div className="font-mono text-amber-300 font-bold">
                      {meter ? `${meter.currentReading} kWh (${meter.status})` : 'None'}
                    </div>
                  </div>

                  {/* Button Spacing, Fixed Box Sizes, and CSS Flex Wrapping */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => onStatusChange(room.id, 'available')}
                      className="w-full h-10 inline-flex items-center justify-center rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition box-border shadow-md"
                    >
                      Mark Repairs Complete (Set Available)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Rooms Quick Maintenance Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white">All Property Rooms Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
          {hotelRooms.map((r) => (
            <div
              key={r.id}
              className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <span className="font-bold text-white block">Room {r.roomNumber}</span>
                <span className="text-[10px] text-slate-400">{r.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.status !== 'Maintenance' ? (
                  <button
                    onClick={() => onStatusChange(r.id, 'Maintenance')}
                    className="inline-flex items-center justify-center min-w-[76px] h-7 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition shrink-0 box-border border border-rose-500/20"
                  >
                    Flag Repair
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusChange(r.id, 'available')}
                    className="inline-flex items-center justify-center min-w-[76px] h-7 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition shrink-0 box-border border border-emerald-500/20"
                  >
                    Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
