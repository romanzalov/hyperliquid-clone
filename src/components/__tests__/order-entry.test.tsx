import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderEntry } from '../order-entry';

// Mock the hooks and dependencies
jest.mock('@privy-io/react-auth', () => ({
  usePrivy: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useSignTypedData: jest.fn(),
}));

jest.mock('../../lib/fetchWithRetry', () => ({
  fetchWithRetry: jest.fn(),
}));

// Import the mocked modules
import { usePrivy } from '@privy-io/react-auth';
import { useSignTypedData } from 'wagmi';
import { fetchWithRetry } from '../../lib/fetchWithRetry';

const mockUsePrivy = usePrivy as jest.MockedFunction<typeof usePrivy>;
const mockUseSignTypedData = useSignTypedData as jest.MockedFunction<typeof useSignTypedData>;
const mockFetchWithRetry = fetchWithRetry as jest.MockedFunction<typeof fetchWithRetry>;

describe('OrderEntry', () => {
  const mockSignTypedDataAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful asset fetch
    mockFetchWithRetry.mockResolvedValue({
      universe: [
        { name: 'BTC' },
        { name: 'ETH' },
        { name: 'SOL' }
      ]
    });

    mockUseSignTypedData.mockReturnValue({
      signTypedDataAsync: mockSignTypedDataAsync,
      data: undefined,
      variables: undefined,
      error: null,
      isError: false,
      isIdle: true,
      isPending: false,
      isSuccess: false,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: 'idle',
      signTypedData: jest.fn(),
      reset: jest.fn(),
      context: undefined,
      submittedAt: 0,
    } as unknown as ReturnType<typeof useSignTypedData>);
  });

  it('renders order entry form when user is not authenticated', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: false,
      user: null,
    } as unknown as ReturnType<typeof usePrivy>);

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    expect(screen.getByText('Market Order')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Buy / Long')).toBeInTheDocument();
    expect(screen.getByText('Sell / Short')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('renders order entry form when user is authenticated', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        wallet: {
          address: '0x1234567890123456789012345678901234567890'
        }
      },
    } as unknown as ReturnType<typeof usePrivy>);

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    expect(screen.getByText('Buy BTC')).toBeInTheDocument();
    expect(screen.getByText('Wallet: 0x1234...7890')).toBeInTheDocument();
  });

  it('toggles between buy and sell sides', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        wallet: {
          address: '0x1234567890123456789012345678901234567890'
        }
      },
    } as unknown as ReturnType<typeof usePrivy>);

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    const sellButton = screen.getByText('Sell / Short');
    act(() => {
      fireEvent.click(sellButton);
    });

    expect(screen.getByText('Sell BTC')).toBeInTheDocument();
  });

  it('updates size input correctly', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        wallet: {
          address: '0x1234567890123456789012345678901234567890'
        }
      },
    } as unknown as ReturnType<typeof usePrivy>);

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    const sizeInput = screen.getByPlaceholderText('0.00');
    act(() => {
      fireEvent.change(sizeInput, { target: { value: '0.1' } });
    });

    expect(sizeInput).toHaveValue(0.1);
  });

  it('shows disabled button when wallet is not connected', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: false,
      user: null,
    } as unknown as ReturnType<typeof usePrivy>);

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    // Wait for assets to load
    await waitFor(() => {
      expect(mockFetchWithRetry).toHaveBeenCalled();
    });

    const sizeInput = screen.getByPlaceholderText('0.00');
    act(() => {
      fireEvent.change(sizeInput, { target: { value: '0.1' } });
    });

    const buyButton = screen.getByText('Connect Wallet');
    expect(buyButton).toBeDisabled();
  });

  it('shows disabled button when size is empty', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        wallet: {
          address: '0x1234567890123456789012345678901234567890'
        }
      },
    } as unknown as ReturnType<typeof usePrivy>);

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    // Wait for assets to load
    await waitFor(() => {
      expect(mockFetchWithRetry).toHaveBeenCalled();
    });

    const buyButton = screen.getByText('Buy BTC');
    expect(buyButton).toBeDisabled();
  });

  it('attempts to place order when all conditions are met', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        wallet: {
          address: '0x1234567890123456789012345678901234567890'
        }
      },
    } as unknown as ReturnType<typeof usePrivy>);

    // Mock successful signature
    mockSignTypedDataAsync.mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b');

    // Mock successful order response
    mockFetchWithRetry
      .mockResolvedValueOnce({
        universe: [{ name: 'BTC' }, { name: 'ETH' }]
      })
      .mockResolvedValueOnce({
        status: 'ok',
        response: { type: 'order', data: { statuses: [{ filled: { totalSz: '0.1' } }] } }
      });

    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await act(async () => {
      render(<OrderEntry symbol="BTC" />);
    });

    // Wait for assets to load
    await waitFor(() => {
      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        'https://api.hyperliquid.xyz/info',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'meta' })
        })
      );
    });

    const sizeInput = screen.getByPlaceholderText('0.00');
    act(() => {
      fireEvent.change(sizeInput, { target: { value: '0.1' } });
    });

    const buyButton = screen.getByText('Buy BTC');
    
    await act(async () => {
      fireEvent.click(buyButton);
    });

    await waitFor(() => {
      expect(mockSignTypedDataAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Order placed: BUY 0.1 BTC');
    });

    alertSpy.mockRestore();
  });
}); 