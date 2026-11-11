import React, { useState, useEffect } from 'react';
import {
  Hotel,
  Room,
  UserLoginSession,
  BookingReservation,
} from '../types';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  BedDouble,
  DollarSign,
  User,
  Mail,
  Phone,
  X,
  CalendarCheck,
  Ban,
  ShieldCheck,
} from 'lucide-react';

interface GuestViewProps {
  session: UserLoginSession;
  hotels: Hotel[];
  rooms: Room[];
  onBookRoom: (
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
  ) => Promise<BookingReservation>;
  onCancelBooking: (roomId: number, bookingId?: string) => Promise<void>;
}

const STORAGE_KEY = 'hotel_manager_guest_reservations';

export const GuestView: React.FC<GuestViewProps> = ({
  session,
  hotels,
  rooms,
  onBookRoom,
  onCancelBooking,
}) => {
  // Navigation tab: 'explore' vs 'my-bookings'
  const [activeTab, setActiveTab] = useState<'explore' | 'my-bookings'>('explore');

  // Filters
  const [selectedHotelId, setSelectedHotelId] = useState<number | 'ALL'>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [availabilityOnly, setAvailabilityOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [guestName, setGuestName] = useState(session?.username ? session.username : '');
  const [guestEmail, setGuestEmail] = useState(session?.email || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [nights, setNights] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Confirmation Receipt Modal State
  const [confirmedReservation, setConfirmedReservation] = useState<BookingReservation | null>(null);

  // Local state for stored reservations
  const [myReservations, setMyReservations] = useState<BookingReservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync reservations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(myReservations));
    } catch {
      // Ignore quota errors
    }
  }, [myReservations]);

  // Update name/email if session changes
  useEffect(() => {
    if (session) {
      if (session.username && !guestName) setGuestName(session.username);
      if (session.email && !guestEmail) setGuestEmail(session.email);
    }
  }, [session]);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    // Hotel filter
    if (selectedHotelId !== 'ALL' && room.hotelId !== selectedHotelId) {
      return false;
    }
    // Room type filter
    if (selectedRoomType !== 'ALL') {
      const type = (room.roomType || 'Standard').toLowerCase();
      if (type !== selectedRoomType.toLowerCase()) return false;
    }
    // Availability only
    if (availabilityOnly && room.status !== 'available') {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hotel = hotels.find((h) => h.id === room.hotelId);
      const matchesRoom = String(room.roomNumber).includes(q);
      const matchesType = (room.roomType || 'Standard').toLowerCase().includes(q);
      const matchesHotel = hotel?.name.toLowerCase().includes(q) || false;
      const matchesCity = hotel?.city?.toLowerCase().includes(q) || false;
      const matchesState = hotel?.state?.toLowerCase().includes(q) || false;
      if (!matchesRoom && !matchesType && !matchesHotel && !matchesCity && !matchesState) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const totalAvailable = rooms.filter((r) => r.status === 'available').length;
  const totalOccupied = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const lowestRate = rooms.reduce((min, r) => {
    const price = r.pricePerNight || 200;
    return price < min ? price : min;
  }, 9999);

  const openBookingModal = (room: Room) => {
    setBookingRoom(room);
    setBookingError('');
    setNights(1);
    setSpecialRequests('');
    if (!guestName && session?.username) setGuestName(session.username);
    if (!guestEmail && session?.email) setGuestEmail(session.email);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom) return;
    if (!guestName.trim()) {
      setBookingError('Please enter your full name.');
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes('@')) {
      setBookingError('Please enter a valid email address.');
      return;
    }
    if (!checkInDate) {
      setBookingError('Please select a check-in date.');
      return;
    }
    if (nights < 1) {
      setBookingError('Length of stay must be at least 1 night.');
      return;
    }

    const hotel = hotels.find((h) => h.id === bookingRoom.hotelId);
    const nightlyPrice = bookingRoom.pricePerNight || 200;
    const totalPrice = nightlyPrice * nights;

    setIsSubmittingBooking(true);
    setBookingError('');

    try {
      const reservation = await onBookRoom(bookingRoom.id, {
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim() || undefined,
        checkInDate,
        nights,
        totalPrice,
        specialRequests: specialRequests.trim() || undefined,
      });

      setMyReservations((prev) => [reservation, ...prev.filter((r) => r.roomId !== bookingRoom.id)]);
      setBookingRoom(null);
      setConfirmedReservation(reservation);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Reservation failed. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelReservation = async (reservation: BookingReservation) => {
    if (!confirm(`Cancel your reservation for Room ${reservation.roomNumber} at ${reservation.hotelName}?`)) {
      return;
    }
    try {
      await onCancelBooking(reservation.roomId, reservation.id);
      setMyReservations((prev) => prev.filter((r) => r.id !== reservation.id));
    } catch {
      // Handled in parent
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. Header Banner & View Toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Guest Portal
            </span>
            <span className="text-xs text-slate-400">
              • Real-Time Availability & Instant Booking
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hotel Reservations & Booking
          </h1>
          <p className="text-xs text-slate-400">
            Browse available rooms across our properties, check live availability, and reserve your stay.
          </p>
        </div>

        {/* View Switcher Tabs with CSS Flex Wrapping & Fixed Box Sizing */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`inline-flex items-center justify-center min-w-[140px] h-10 px-4 text-xs font-bold rounded-xl transition-all duration-150 shrink-0 ${
              activeTab === 'explore'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-950 border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 mr-1.5" />
            <span>Browse Rooms</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-bookings')}
            className={`inline-flex items-center justify-center min-w-[155px] h-10 px-4 text-xs font-bold rounded-xl transition-all duration-150 shrink-0 relative ${
              activeTab === 'my-bookings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-950 border border-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4 mr-1.5" />
            <span>My Bookings</span>
            {myReservations.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950 text-amber-400 font-extrabold border border-amber-500/30">
                {myReservations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Key Availability Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-slate-400 block mb-0.5 text-[11px]">Ready for Booking</span>
          <span className="text-2xl font-extrabold text-emerald-400">{totalAvailable}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Instant confirmation</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-slate-400 block mb-0.5 text-[11px]">Total Properties</span>
          <span className="text-2xl font-extrabold text-white">{hotels.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Destinations</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-slate-400 block mb-0.5 text-[11px]">Starting From</span>
          <span className="text-2xl font-extrabold text-amber-400">
            ${lowestRate < 9999 ? lowestRate : 150}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Per night</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-slate-400 block mb-0.5 text-[11px]">Active Reservations</span>
          <span className="text-2xl font-extrabold text-blue-400">{myReservations.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Your bookings</span>
        </div>
      </div>

      {/* 3. EXPLORE & BOOK VIEW */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          {/* Search & Filter Bar with CSS Flex Wrapping & Fixed Box Sizes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by hotel, city, state, or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Hotel Selector */}
                <select
                  value={selectedHotelId}
                  onChange={(e) =>
                    setSelectedHotelId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ALL">All Hotel Properties ({hotels.length})</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.city ? `(${h.city})` : ''}
                    </option>
                  ))}
                </select>

                {/* Room Type Selector */}
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ALL">All Room Types</option>
                  <option value="Standard">Standard Rooms</option>
                  <option value="Deluxe">Deluxe Rooms</option>
                  <option value="Suite">Suites</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Executive">Executive</option>
                </select>

                {/* Availability Only Toggle */}
                <button
                  type="button"
                  onClick={() => setAvailabilityOnly((prev) => !prev)}
                  className={`inline-flex items-center justify-center min-w-[130px] h-9 px-3 text-xs font-semibold rounded-xl transition shrink-0 border ${
                    availabilityOnly
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>{availabilityOnly ? 'Available Only' : 'All Statuses'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Room Availability Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <BedDouble className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-white text-sm">No rooms found</p>
                <p className="mt-1 text-slate-500">
                  Try adjusting your hotel filter, search terms, or unchecking "Available Only".
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const hotel = hotels.find((h) => h.id === room.hotelId);
                const isAvailable = room.status === 'available';
                const isOccupied = room.status === 'OCCUPIED';
                const isMaintenance = room.status === 'Maintenance';
                const price = room.pricePerNight || 200;
                const roomType = room.roomType || 'Standard';

                // Check if this guest booked this room in this session
                const userReservation = myReservations.find((res) => res.roomId === room.id);

                return (
                  <div
                    key={room.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {roomType}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isOccupied
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAvailable
                                ? 'bg-emerald-400'
                                : isOccupied
                                ? 'bg-blue-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span>
                            {isAvailable ? 'Available' : isOccupied ? 'Reserved' : 'Maintenance'}
                          </span>
                        </span>
                      </div>

                      {/* Room Number & Hotel Name */}
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Room {room.roomNumber}
                      </h3>
                      <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{hotel?.name || 'Grand Property'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>
                          {[hotel?.city, hotel?.state, hotel?.country].filter(Boolean).join(', ') ||
                            'Prime Location'}
                        </span>
                      </div>

                      {/* Amenities pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          WiFi Included
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          Climate Control
                        </span>
                        {room.floor && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            Floor {room.floor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Booking Action */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Rate</div>
                        <div className="text-base font-extrabold text-white">
                          ${price}
                          <span className="text-[11px] font-normal text-slate-400">/night</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAvailable ? (
                          <button
                            type="button"
                            onClick={() => openBookingModal(room)}
                            className="inline-flex items-center justify-center min-w-[110px] h-9 px-3.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 box-border"
                          >
                            <span>Book Now</span>
                          </button>
                        ) : userReservation ? (
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(userReservation)}
                            className="inline-flex items-center justify-center min-w-[110px] h-9 px-3 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-rose-500/20 text-blue-300 hover:text-rose-300 border border-blue-500/30 hover:border-rose-500/30 transition box-border"
                            title="Click to cancel your reservation"
                          >
                            <span>Your Booking</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center min-w-[110px] h-9 px-3.5 rounded-xl text-xs font-semibold bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed box-border"
                          >
                            <span>{isMaintenance ? 'Under Service' : 'Occupied'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. MY BOOKINGS VIEW */}
      {activeTab === 'my-bookings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Your Confirmed Reservations</h2>
              <p className="text-xs text-slate-400">
                Manage upcoming stays and review your booking details.
              </p>
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
              {myReservations.length} Active {myReservations.length === 1 ? 'Stay' : 'Stays'}
            </span>
          </div>

          {myReservations.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <CalendarCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No active reservations</p>
              <p className="mt-1 text-slate-400">
                You have not booked any rooms yet. Browse availability to plan your stay!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="mt-4 inline-flex items-center justify-center min-w-[140px] h-9 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20"
              >
                Browse Available Rooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Ref: {res.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Confirmed</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-2">
                      Room {res.roomNumber} ({res.roomType || 'Standard'})
                    </h3>
                    <div className="text-xs text-slate-300 font-medium">{res.hotelName}</div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Guest Name:</span>
                        <span className="font-semibold text-white">{res.guestName}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Check-In:</span>
                        <span className="font-semibold text-white">{res.checkInDate}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Duration:</span>
                        <span className="font-semibold text-white">
                          {res.nights} {res.nights === 1 ? 'night' : 'nights'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Total Cost:</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          ${res.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {res.specialRequests && (
                      <div className="text-[11px] text-slate-400 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <strong>Requests:</strong> {res.specialRequests}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelReservation(res)}
                      className="inline-flex items-center justify-center min-w-[130px] h-8 px-3 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      <span>Cancel Stay</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. INTERACTIVE BOOKING MODAL */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[92%] sm:w-[84%] md:w-[70%] lg:w-[50%] max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Book Room {bookingRoom.roomNumber}</h2>
                  <span className="text-[11px] text-slate-400">
                    {hotels.find((h) => h.id === bookingRoom.hotelId)?.name || 'Hotel Property'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 overflow-y-auto text-xs">
              {bookingError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  {bookingError}
                </div>
              )}

              {/* Room Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    {bookingRoom.roomType || 'Standard'} Room
                  </span>
                  <div className="text-white font-bold text-sm">Room #{bookingRoom.roomNumber}</div>
                  <div className="text-slate-400 text-[11px]">
                    Floor {bookingRoom.floor || 1} • High-Speed WiFi & Climate Control
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Nightly Rate</span>
                  <span className="text-base font-extrabold text-white">
                    ${bookingRoom.pricePerNight || 200}
                  </span>
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. eleanor@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Length of Stay (Nights) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNights(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        nights === num
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {num} {num === 1 ? 'Night' : 'Nights'}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={nights}
                    onChange={(e) => setNights(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Quiet room requested, early check-in arrival time..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    Rate: ${bookingRoom.pricePerNight || 200} × {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                  <span className="font-mono text-white">
                    ${(bookingRoom.pricePerNight || 200) * nights}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Taxes & Operational Service Fees</span>
                  <span className="font-mono text-white">$0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm text-white">
                  <span>Total Amount Due</span>
                  <span className="text-amber-400 text-base">
                    ${((bookingRoom.pricePerNight || 200) * nights).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookingRoom(null)}
                  className="inline-flex items-center justify-center min-w-[95px] h-10 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="inline-flex items-center justify-center min-w-[170px] h-10 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition shadow-md shadow-amber-500/20"
                >
                  {isSubmittingBooking ? 'Confirming Stay...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BOOKING CONFIRMATION RECEIPT MODAL */}
      {confirmedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-[92%] sm:w-[84%] md:w-[70%] lg:w-[48%] max-w-lg overflow-hidden shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Booking Confirmed!</h2>
              <p className="text-xs text-slate-400">
                Your reservation has been confirmed and registered in the property system.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Confirmation Code:</span>
                <span className="font-mono font-bold text-amber-400">{confirmedReservation.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hotel Property:</span>
                <span className="font-semibold text-white">{confirmedReservation.hotelName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reserved Room:</span>
                <span className="font-semibold text-white">
                  Room {confirmedReservation.roomNumber} ({confirmedReservation.roomType || 'Standard'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Guest:</span>
                <span className="font-semibold text-white">{confirmedReservation.guestName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Check-In Date:</span>
                <span className="font-semibold text-white">{confirmedReservation.checkInDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Length of Stay:</span>
                <span className="font-semibold text-white">
                  {confirmedReservation.nights} {confirmedReservation.nights === 1 ? 'Night' : 'Nights'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 font-bold text-sm">
                <span className="text-white">Total Amount:</span>
                <span className="text-emerald-400 font-mono">
                  ${confirmedReservation.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmedReservation(null);
                  setActiveTab('my-bookings');
                }}
                className="inline-flex items-center justify-center min-w-[160px] h-10 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20"
              >
                View My Bookings
              </button>
              <button
                type="button"
                onClick={() => setConfirmedReservation(null)}
                className="inline-flex items-center justify-center min-w-[100px] h-10 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
