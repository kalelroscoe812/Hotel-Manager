import React, { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminView } from '../components/AdminView';
import { Hotel, Room, User } from '../types';

describe('AdminView Room Management & Pricing Tests', () => {
  const mockHotels: Hotel[] = [
    {
      id: 1,
      name: 'Downtown Grand Hotel',
      address: '500 Main St',
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      totalRooms: 5,
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
      pricePerNight: 180,
    },
  ];

  const mockUsers: User[] = [
    {
      id: 1,
      username: 'admin_user',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      hotelId: 1,
    },
  ];

  it('renders property table and allows opening property manager', () => {
    render(
      <AdminView
        hotels={mockHotels}
        rooms={mockRooms}
        users={mockUsers}
        onOpenCreateHotel={vi.fn()}
        onUpdateHotel={vi.fn()}
        onAddUserToHotel={vi.fn()}
        onAddRoomToHotel={vi.fn()}
        onDeleteHotel={vi.fn()}
        onDeleteRoom={vi.fn()}
        onDeleteUser={vi.fn()}
      />
    );

    expect(screen.getByText('Downtown Grand Hotel')).toBeInTheDocument();
    const manageBtn = screen.getByRole('button', { name: /manage/i });
    expect(manageBtn).toBeInTheDocument();
  });

  it('displays room type and nightly price in property details and allows editing', async () => {
    const handleUpdateRoom = vi.fn().mockResolvedValue({});
    render(
      <AdminView
        hotels={mockHotels}
        rooms={mockRooms}
        users={mockUsers}
        onOpenCreateHotel={vi.fn()}
        onUpdateHotel={vi.fn()}
        onAddUserToHotel={vi.fn()}
        onAddRoomToHotel={vi.fn()}
        onDeleteHotel={vi.fn()}
        onDeleteRoom={vi.fn()}
        onDeleteUser={vi.fn()}
        onUpdateRoom={handleUpdateRoom}
      />
    );

    // Open manage hotel modal
    fireEvent.click(screen.getByRole('button', { name: /manage/i }));

    // Details tab is active by default; check room details are rendered
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('$180/night')).toBeInTheDocument();

    // Click "Edit" on the room
    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    // Edit Room Modal should appear
    expect(screen.getByText('Room Inventory Edit')).toBeInTheDocument();
    expect(screen.getByText('Edit Room 101')).toBeInTheDocument();

    // Change room type to Suite and price to 250
    const roomTypeSelect = screen.getByDisplayValue('Standard');
    fireEvent.change(roomTypeSelect, { target: { value: 'Suite' } });

    const priceInput = screen.getByDisplayValue('180');
    fireEvent.change(priceInput, { target: { value: '250' } });

    // Submit changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(handleUpdateRoom).toHaveBeenCalledWith(101, expect.objectContaining({
      roomNumber: 101,
      roomType: 'Suite',
      pricePerNight: 250,
    }));
  });
});
