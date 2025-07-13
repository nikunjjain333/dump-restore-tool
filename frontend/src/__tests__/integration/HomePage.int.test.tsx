import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import { api } from '../../api/client';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    getConfigs: jest.fn(),
  },
}));

// Mock react-hot-toast to prevent memory leaks
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

describe('HomePage Integration', () => {
  // Mock API response
  const mockConfigs = [
    {
      id: 1,
      name: 'Test Config',
      db_type: 'postgresql',
      params: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass'
      }
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful API response
    (api.getConfigs as jest.Mock).mockResolvedValue({
      data: mockConfigs
    });
  });

  afterEach(() => {
    // Clean up after each test
    cleanup();
    
    // Clear all timers
    jest.clearAllTimers();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up after all tests
    jest.restoreAllMocks();
  });

  it('renders hero section and create config button', async () => {
    render(
      <MemoryRouter>
        <HomePage
          dockerStatus={{ isRunning: true, status: 'running' }}
          checkDockerStatus={jest.fn()}
          isCheckingStatus={false}
        />
      </MemoryRouter>
    );

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('Database Management Made Simple')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /create new configuration/i })).toBeInTheDocument();
  });

  it('loads and displays recent configurations', async () => {
    render(
      <MemoryRouter>
        <HomePage
          dockerStatus={{ isRunning: true, status: 'running' }}
          checkDockerStatus={jest.fn()}
          isCheckingStatus={false}
        />
      </MemoryRouter>
    );

    // Wait for the API call to complete
    await waitFor(() => {
      expect(api.getConfigs).toHaveBeenCalled();
    });

    // Check if the config is displayed
    await waitFor(() => {
      expect(screen.getByText('Test Config')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (api.getConfigs as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <HomePage
          dockerStatus={{ isRunning: true, status: 'running' }}
          checkDockerStatus={jest.fn()}
          isCheckingStatus={false}
        />
      </MemoryRouter>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Database Management Made Simple')).toBeInTheDocument();
    });

    // Wait for the loading state to complete and then check for empty state
    await waitFor(() => {
      expect(screen.queryByText('Loading recent configurations...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // The component should show empty state when API fails
    await waitFor(() => {
      expect(screen.getByText('No Recent Configurations')).toBeInTheDocument();
    });
  });
}); 