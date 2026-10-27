import React, { useState } from 'react';
import { Hotel, Room, ElectricityMeter, UserLoginSession } from '../types';
import {
  BedDouble,
  Zap,
  Wrench,
  CheckCircle2,
  Users,
  Building2,
  AlertTriangle,
  ArrowRight,
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

  const [guestNameInput, setGuestNameInput] = useState('');
  const [selectedRoomForCheckin, setSelectedRoomForCheckin] = useState<number | null>(null);

  const handleCheckIn = (roomId: number) => {
    onStatusChange(roomId, 'OCCUPIED');
    setSelectedRoomForCheckin(null);
    setGuestNameInput('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            ROLE: FRONT_DESK VIEW
          </span>
          <span className="text-xs text-slate-400">
            • Logged in as @{session.username} ({currentHotel?.name})
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Front Desk Operations & Guest Check-in
        </h1>
        <p className="text-xs text-slate-400">
          Manage live arrivals, room turnover, and guest room assignments.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-semibold">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Available</span>
            <span className="text-lg font-bold text-emerald-400">{availableRooms.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Occupied</span>
            <span className="text-lg font-bold text-blue-400">{occupiedRooms.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Maintenance</span>
            <span className="text-lg font-bold text-rose-400">{maintenanceRooms.length}</span>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {hotelRooms.map((room) => (
          <div
            key={room.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
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
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              {room.status === 'available' && (
                <button
                  onClick={() => handleCheckIn(room.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-bold bg-blue-500 hover:bg-blue-400 text-slate-950 transition"
                >
                  Check In Guest
                </button>
              )}
              {room.status === 'OCCUPIED' && (
                <button
                  onClick={() => onStatusChange(room.id, 'available')}
                  className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Check Out (Set Available)
                </button>
              )}
              {room.status === 'Maintenance' && (
                <button
                  onClick={() => onStatusChange(room.id, 'available')}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                >
                  Cleared from Maintenance
                </button>
              )}
            </div>
          </div>
        ))}
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
  onUpdateMeterReading: (roomId: number, reading: number) => void;
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
  const occupancyPercent = hotelRooms.length > 0 ? Math.round((occupiedCount / hotelRooms.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            ROLE: PROPERTY_MANAGER VIEW
          </span>
          <span className="text-xs text-slate-400">
            • Managing: {currentHotel?.name} (@{session.username})
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Property Operations & Utility Telemetry
        </h1>
        <p className="text-xs text-slate-400">
          Occupancy performance monitoring and room-level electricity meter readings.
        </p>

        {/* Property Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Total Rooms</span>
            <span className="text-2xl font-bold text-white">{currentHotel?.totalRooms || hotelRooms.length}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Current Occupancy</span>
            <span className="text-2xl font-bold text-blue-400">{occupancyPercent}%</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">({occupiedCount}/{hotelRooms.length} rooms)</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Electricity Meters</span>
            <span className="text-2xl font-bold text-amber-400">{meters.length}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Active monitoring</span>
          </div>
        </div>
      </div>

      {/* Electricity Meters Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Room Electricity Meters (Assignment Table Specification)</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Room Status</th>
                <th className="py-3 px-4">Current Reading (kWh)</th>
                <th className="py-3 px-4">Meter Status</th>
                <th className="py-3 px-4 text-right">Update Reading</th>
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
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {meter?.status || 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {meter && (
                        <button
                          onClick={() => {
                            const newRead = prompt('Enter new kWh reading:', String(meter.currentReading));
                            if (newRead && !isNaN(Number(newRead))) {
                              onUpdateMeterReading(r.id, Number(newRead));
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        >
                          Log Reading
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            ROLE: MAINTENANCE_ENGINEER VIEW
          </span>
          <span className="text-xs text-slate-400">
            • Logged in as @{session.username} ({currentHotel?.name})
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Engineering & Maintenance Work Orders
        </h1>
        <p className="text-xs text-slate-400">
          Monitor rooms flagged for repairs and check electrical meter telemetry.
        </p>
      </div>

      {/* Maintenance Rooms */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-rose-400" />
          <span>Rooms Flagged for Maintenance ({maintenanceRooms.length})</span>
        </h2>

        {maintenanceRooms.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
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
                  className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4"
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

                  <button
                    onClick={() => onStatusChange(room.id, 'available')}
                    className="w-full py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
                  >
                    Mark Repairs Complete (Set Available)
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Rooms Quick Maintenance Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">All Property Rooms Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {hotelRooms.map((r) => (
            <div
              key={r.id}
              className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-white block">Room {r.roomNumber}</span>
                <span className="text-[10px] text-slate-400">{r.status}</span>
              </div>
              {r.status !== 'Maintenance' ? (
                <button
                  onClick={() => onStatusChange(r.id, 'Maintenance')}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition"
                >
                  Flag Repair
                </button>
              ) : (
                <button
                  onClick={() => onStatusChange(r.id, 'available')}
                  className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition"
                >
                  Ready
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};