import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateHotelModal } from '../components/CreateHotelModal';

describe('CreateHotelModal Component Tests', () => {
  it('renders modal when isOpen is true', () => {
    render(
      <CreateHotelModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Register New Property')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Harbor House/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. MA/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <CreateHotelModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText('Register New Property')).not.toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    const handleSubmit = vi.fn();
    render(
      <CreateHotelModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /register property/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Hotel name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Address is required/i)).toBeInTheDocument();
  });
});
