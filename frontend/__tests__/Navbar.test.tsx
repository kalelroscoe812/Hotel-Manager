import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import { UserLoginSession } from '../types';

describe('Navbar Component Tests', () => {
  const mockSession: UserLoginSession = {
    userId: 1,
    username: 'alex_admin',
    role: 'ADMIN',
    email: 'alex@hotelmanager.com',
    token: 'fake-jwt-token-xyz',
    hotelId: null,
  };

  it('renders brand name and enterprise tag', () => {
    render(
      <Navbar
        currentTab="hotels"
        setCurrentTab={vi.fn()}
        session={mockSession}
        onLogout={vi.fn()}
        onOpenCreateHotel={vi.fn()}
      />
    );

    expect(screen.getByText('Hotel Manager')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('displays user role badge and username', () => {
    render(
      <Navbar
        currentTab="hotels"
        setCurrentTab={vi.fn()}
        session={mockSession}
        onLogout={vi.fn()}
        onOpenCreateHotel={vi.fn()}
      />
    );

    expect(screen.getByText(/alex_admin/)).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('calls onLogout when Log Out button is clicked', () => {
    const handleLogout = vi.fn();
    render(
      <Navbar
        currentTab="hotels"
        setCurrentTab={vi.fn()}
        session={mockSession}
        onLogout={handleLogout}
        onOpenCreateHotel={vi.fn()}
      />
    );

    const logoutBtn = screen.getByText('Log Out');
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
