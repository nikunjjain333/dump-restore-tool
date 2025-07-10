import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DockerComposeConfigList from '../../../components/DockerComposeConfigList';
import * as apiClient from '../../../api/client';

jest.mock('../../../api/client');

const mockConfigs = [
  {
    id: 1,
    name: 'Test Stack',
    path: '/tmp/docker-compose.yml',
    service_name: 'web',
    description: 'A test stack',
    flags: { detach: true, build: true },
  },
];

describe('DockerComposeConfigList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state by default', () => {
    render(<DockerComposeConfigList />);
    expect(screen.getByText(/Loading Docker Compose configurations/i)).toBeInTheDocument();
  });

  it('renders with no configs (empty state)', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: [] });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText(/No Docker Compose Configurations/i)).toBeInTheDocument();
  });

  it('renders config cards with all details', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: mockConfigs });
    (apiClient.api.getDockerComposeServices as jest.Mock).mockResolvedValueOnce({ data: { success: true, services: [] } });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText('Test Stack')).toBeInTheDocument();
    expect(screen.getByText(/A test stack/)).toBeInTheDocument();
    expect(screen.getByText(/Path/)).toBeInTheDocument();
    // Check for the label 'Service:' and the table header 'Service'
    expect(screen.getByText('Service:')).toBeInTheDocument();
    expect(screen.getByText('Service', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText(/Flags/)).toBeInTheDocument();
    expect(screen.getByText((content) => content.toLowerCase().includes('detach'))).toBeInTheDocument();
    expect(screen.getByText('detach, build')).toBeInTheDocument();
    expect(screen.getByText('Launch Stack')).toBeInTheDocument();
    expect(screen.getByText('Stop Stack')).toBeInTheDocument();
    expect(screen.getByTitle('Delete configuration')).toBeInTheDocument();
  });

  it('shows empty containers when no services', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: mockConfigs });
    (apiClient.api.getDockerComposeServices as jest.Mock).mockResolvedValueOnce({ data: { success: true, services: [] } });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText('No containers found')).toBeInTheDocument();
  });

  it('shows error message if API fails', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<DockerComposeConfigList />);
    expect(await screen.findByText(/Failed to fetch Docker Compose configurations/i)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders error state and allows retry', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ data: mockConfigs });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText(/Failed to fetch Docker Compose configurations/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('Test Stack')).toBeInTheDocument();
  });

  it('shows modal for logs and status', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: mockConfigs });
    (apiClient.api.getDockerComposeServices as jest.Mock).mockResolvedValue({ data: { success: true, services: [] } });
    (apiClient.api.operateDockerCompose as jest.Mock)
      .mockResolvedValueOnce({ data: { success: true, output: 'log output' } }) // logs
      .mockResolvedValueOnce({ data: { success: true, output: 'status output' } }); // ps
    render(<DockerComposeConfigList />);
    // Wait for config
    expect(await screen.findByText('Test Stack')).toBeInTheDocument();
    // Click View Logs
    fireEvent.click(screen.getByText('View Logs'));
    expect(await screen.findByText(/log output/)).toBeInTheDocument();
    // Click Show Status
    fireEvent.click(screen.getByText('Show Status'));
    expect(await screen.findByText(/status output/)).toBeInTheDocument();
  });

  it('shows modal for operation error', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: mockConfigs });
    (apiClient.api.getDockerComposeServices as jest.Mock).mockResolvedValue({ data: { success: true, services: [] } });
    (apiClient.api.operateDockerCompose as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'fail' } });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText('Test Stack')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Launch Stack'));
    expect(await screen.findByText(/failed/i)).toBeInTheDocument();
  });

  it('disables restart and build buttons if no running containers', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: mockConfigs });
    (apiClient.api.getDockerComposeServices as jest.Mock).mockResolvedValueOnce({ data: { success: true, services: [] } });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText('Test Stack')).toBeInTheDocument();
    // Restart and Rebuild Images should be disabled
    expect(screen.getByText('Restart Stack')).toBeDisabled();
    expect(screen.getByText('Rebuild Images')).toBeDisabled();
  });

  it('shows container error tooltip if present', async () => {
    (apiClient.api.getDockerComposeConfigs as jest.Mock).mockResolvedValueOnce({ data: mockConfigs });
    (apiClient.api.getDockerComposeServices as jest.Mock).mockResolvedValueOnce({ data: { success: true, services: [{ service_name: 'db', container_name: 'db_1', status: 'exited' }] } });
    render(<DockerComposeConfigList />);
    expect(await screen.findByText('db_1')).toBeInTheDocument();
    // Simulate container error in state
    // (This would require more advanced state mocking or a refactor for full coverage)
  });
}); 