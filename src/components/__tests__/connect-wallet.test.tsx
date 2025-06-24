import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConnectWallet } from '../connect-wallet';
import { usePrivy } from '@privy-io/react-auth';

// Mock the usePrivy hook
jest.mock('@privy-io/react-auth', () => ({
  usePrivy: jest.fn(),
}));

// Mock the useSignTypedData hook from wagmi
jest.mock('wagmi', () => ({
  useSignTypedData: () => ({
    signTypedDataAsync: jest.fn().mockResolvedValue('0x'),
  }),
}));

describe('ConnectWallet', () => {
  it('renders connect button when user is not authenticated', () => {
    // Arrange
    (usePrivy as jest.Mock).mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      authenticated: false,
    });

    // Act
    render(<ConnectWallet />);

    // Assert
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('renders logout and approve agent buttons when user is authenticated', () => {
    // Arrange
    (usePrivy as jest.Mock).mockReturnValue({
      user: { wallet: { address: '0x1234...5678' } },
      login: jest.fn(),
      logout: jest.fn(),
      authenticated: true,
    });

    // Act
    render(<ConnectWallet />);

    // Assert
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve agent/i })).toBeInTheDocument();
  });
}); 