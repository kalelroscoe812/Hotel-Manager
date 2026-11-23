import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestView } from '../components/GuestView';
import { Hotel, Room, UserLoginSession } from '../types';

describe('GuestView Component Tests', () => {
  const mockSession: UserLoginSession = {
    userId: 10,
    username: 'traveler_guest',
    role: 'GUEST',
    email: 'guest@example.com',
  };

  const mockHotels: Hotel[] = [
    {
      id: 1,
      name: 'Atlanta Luxury Suites',
      address: '100 Peachtree St',
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      totalRooms: 10,
    },
    {
      id: 2,
      name: 'Boston Harbor Hotel',
      address: '70 Rowes Wharf',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      totalRooms: 15,
    },
  ];

  const mockRooms: Room[] = [
    {
      id: 101,
      hotelId: 1,
      roomNumber: 101,
      status: 'available',
      roomType: 'Standard',
      floor: 1,
      pricePerNight: 120,
    },
    {
      id: 102,
      hotelId: 1,
      roomNumber: 102,
      status: 'available',
      roomType: 'Suite',
      floor: 2,
      pricePerNight: 350,
    },
    {
      id: 201,
      hotelId: 2,
      roomNumber: 201,
      status: 'available',
      roomType: 'Deluxe',
      floor: 2,
      pricePerNight: 280,
    },
  ];

  it('renders Guest Portal with hotel catalog and availability count', () => {
    render(
      <GuestView
        session={mockSession}
        hotels={mockHotels}
        rooms={mockRooms}
        onBookRoom={vi.fn()}
        onCancelBooking={vi.fn()}
      />
    );

    expect(screen.getByText('Guest Portal')).toBeInTheDocument();
    expect(screen.getByText('Hotel Reservations & Booking')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Room 102')).toBeInTheDocument();
    expect(screen.getByText('Room 201')).toBeInTheDocument();
  });

  it('filters rooms by location', () => {
    render(
      <GuestView
        session={mockSession}
        hotels={mockHotels}
        rooms={mockRooms}
        onBookRoom={vi.fn()}
        onCancelBooking={vi.fn()}
      />
    );

    const locationSelect = screen.getByDisplayValue(/All Locations/i);
    fireEvent.change(locationSelect, { target: { value: 'Atlanta, GA' } });

    // Atlanta rooms should be visible
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Room 102')).toBeInTheDocument();
    // Boston room should not be visible
    expect(screen.queryByText('Room 201')).not.toBeInTheDocument();
  });

  it('filters rooms by price tier preset', () => {
    render(
      <GuestView
        session={mockSession}
        hotels={mockHotels}
        rooms={mockRooms}
        onBookRoom={vi.fn()}
        onCancelBooking={vi.fn()}
      />
    );

    // Click "< $150" preset button
    const under150Btn = screen.getByRole('button', { name: '< $150' });
    fireEvent.click(under150Btn);

    // Only Room 101 ($120) should match
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.queryByText('Room 102')).not.toBeInTheDocument(); // $350
    expect(screen.queryByText('Room 201')).not.toBeInTheDocument(); // $280
  });

  it('shows empty state when no rooms match filters and allows reset', () => {
    render(
      <GuestView
        session={mockSession}
        hotels={mockHotels}
        rooms={mockRooms}
        onBookRoom={vi.fn()}
        onCancelBooking={vi.fn()}
      />
    );

    // Search for nonexistent room
    const searchInput = screen.getByPlaceholderText(/Search by hotel/i);
    fireEvent.change(searchInput, { target: { value: 'NonexistentRoomXYZ' } });

    expect(screen.getByText(/No matching rooms found/i)).toBeInTheDocument();

    // Click reset button in empty state
    const resetBtn = screen.getByRole('button', { name: /Reset All Filters/i });
    fireEvent.click(resetBtn);

    // All rooms restored
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Room 201')).toBeInTheDocument();
  });
});
