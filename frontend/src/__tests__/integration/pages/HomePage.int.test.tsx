import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../../../api/client';
import HomePage from '../../../pages/HomePage';

// Mock the API client
jest.mock('../../../api/client', () => ({
  api: {
    getConfigs: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('HomePage Integration Tests', () => {
  const defaultProps = {
    dockerStatus: {
      isRunning: true,
      status: 'running',
      info: {
        containers: 5,
        images: 12,
        version: '24.0.5',
        os: 'linux',
        architecture: 'x86_64',
      },
    },
    checkDockerStatus: jest.fn(),
    isCheckingStatus: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the home page with all sections', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      expect(screen.getByText('Database Management Made Simple')).toBeInTheDocument();
      expect(screen.getByText('Efficiently dump and restore your databases with our powerful tool')).toBeInTheDocument();
      expect(screen.getByText('Create New Configuration')).toBeInTheDocument();
      expect(screen.getByText('Docker Control')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Recent Configurations')).toBeInTheDocument();
    });

    it('should render hero section with stats', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Database Types')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('should render quick action cards', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      expect(screen.getByText('Add Configuration')).toBeInTheDocument();
      expect(screen.getByText('View Configurations')).toBeInTheDocument();
      expect(screen.getByText('Quick Start')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to add configuration when create button is clicked', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      const createButton = screen.getByText('Create New Configuration');
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/add-configuration');
    });

    it('should navigate to add configuration when quick start is clicked', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      const quickStartCard = screen.getByText('Quick Start').closest('.action-card');
      fireEvent.click(quickStartCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/add-configuration');
    });

    it('should navigate to configurations when view configurations is clicked', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      const viewConfigsCard = screen.getByText('View Configurations').closest('.action-card');
      fireEvent.click(viewConfigsCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/configurations');
    });

    it('should navigate to add configuration when add configuration card is clicked', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      const addConfigCard = screen.getByText('Add Configuration').closest('.action-card');
      fireEvent.click(addConfigCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/add-configuration');
    });
  });

  describe('Recent Configurations', () => {
    it('should load and display recent configurations', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Production PostgreSQL',
          db_type: 'postgres',
          params: { host: 'localhost', port: 5432, database: 'prod' },
          restore_password: 'password',
        },
        {
          id: 2,
          name: 'Development MySQL',
          db_type: 'mysql',
          params: { host: 'localhost', port: 3306, database: 'dev' },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Production PostgreSQL')).toBeInTheDocument();
        expect(screen.getByText('Development MySQL')).toBeInTheDocument();
        expect(screen.getByText('POSTGRES')).toBeInTheDocument();
        expect(screen.getByText('MYSQL')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching configurations', () => {
      mockApi.getConfigs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading recent configurations...')).toBeInTheDocument();
    });

    it('should show empty state when no configurations exist', async () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Recent Configurations')).toBeInTheDocument();
        expect(screen.getByText('Create your first configuration to get started')).toBeInTheDocument();
        expect(screen.getByText('Create Configuration')).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      mockApi.getConfigs.mockRejectedValue(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load recent configs:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should navigate to add configuration when clicking on a config card', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Production PostgreSQL',
          db_type: 'postgres',
          params: { host: 'localhost', port: 5432 },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        const configCard = screen.getByText('Production PostgreSQL').closest('.config-card');
        fireEvent.click(configCard!);
        expect(mockNavigate).toHaveBeenCalledWith('/add-configuration', {
          state: { selectedConfig: mockConfigs[0] },
        });
      });
    });

    it('should display configuration parameters correctly', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Test Config',
          db_type: 'postgres',
          params: { host: 'localhost', port: 5432, database: 'test' },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('host:')).toBeInTheDocument();
        expect(screen.getByText('localhost')).toBeInTheDocument();
        expect(screen.getByText('port:')).toBeInTheDocument();
        expect(screen.getByText('5432')).toBeInTheDocument();
      });
    });

    it('should show "+X more" when config has more than 2 parameters', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Test Config',
          db_type: 'postgres',
          params: { host: 'localhost', port: 5432, database: 'test', username: 'user' },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });

    it('should limit recent configurations to 3 most recent', async () => {
      const mockConfigs = [
        { id: 1, name: 'Config 1', db_type: 'postgres', params: {}, restore_password: 'password' },
        { id: 2, name: 'Config 2', db_type: 'mysql', params: {}, restore_password: 'password' },
        { id: 3, name: 'Config 3', db_type: 'mongodb', params: {}, restore_password: 'password' },
        { id: 4, name: 'Config 4', db_type: 'redis', params: {}, restore_password: 'password' },
        { id: 5, name: 'Config 5', db_type: 'sqlite', params: {}, restore_password: 'password' },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Config 5')).toBeInTheDocument();
        expect(screen.getByText('Config 4')).toBeInTheDocument();
        expect(screen.getByText('Config 3')).toBeInTheDocument();
        expect(screen.queryByText('Config 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Config 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Docker Integration', () => {
    it('should pass docker status to DockerButton component', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      // DockerButton should be rendered with the provided props
      expect(screen.getByText('Docker Control')).toBeInTheDocument();
    });

    it('should handle docker status checking', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      expect(defaultProps.checkDockerStatus).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration parameters', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Empty Config',
          db_type: 'postgres',
          params: {},
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Empty Config')).toBeInTheDocument();
      });
    });

    it('should handle configuration with null parameters', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Null Config',
          db_type: 'postgres',
          params: { host: null, port: null },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('host:')).toBeInTheDocument();
        expect(screen.getByText('null')).toBeInTheDocument();
      });
    });

    it('should handle configuration with undefined parameters', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Undefined Config',
          db_type: 'postgres',
          params: { host: undefined, port: undefined },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('host:')).toBeInTheDocument();
        expect(screen.getByText('undefined')).toBeInTheDocument();
      });
    });

    it('should handle very long configuration names', async () => {
      const longName = 'a'.repeat(100);
      const mockConfigs = [
        {
          id: 1,
          name: longName,
          db_type: 'postgres',
          params: { host: 'localhost' },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('should handle special characters in configuration names', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Test-Config_123 @#$%',
          db_type: 'postgres',
          params: { host: 'localhost' },
          restore_password: 'password',
        },
      ];

      mockApi.getConfigs.mockResolvedValue({ data: mockConfigs });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test-Config_123 @#$%')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should only load configurations once on mount', async () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      const { rerender } = render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockApi.getConfigs).toHaveBeenCalledTimes(1);
      });

      // Rerender with same props
      rerender(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      // Should not call API again
      expect(mockApi.getConfigs).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid navigation clicks', () => {
      mockApi.getConfigs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      const createButton = screen.getByText('Create New Configuration');
      
      // Click multiple times rapidly
      fireEvent.click(createButton);
      fireEvent.click(createButton);
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockApi.getConfigs.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load recent configs:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle malformed API response', async () => {
      mockApi.getConfigs.mockResolvedValue({ data: null as any });

      render(
        <BrowserRouter>
          <HomePage {...defaultProps} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Recent Configurations')).toBeInTheDocument();
      });
    });
  });
}); 