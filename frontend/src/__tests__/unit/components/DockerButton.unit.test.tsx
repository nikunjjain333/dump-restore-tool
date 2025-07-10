import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DockerButton from '../../../components/DockerButton';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const baseStatus = {
  isRunning: false,
  status: 'unknown',
};

describe('DockerButton', () => {
  it('renders unknown status and hint', () => {
    render(
      <DockerButton
        dockerStatus={baseStatus}
        checkDockerStatus={jest.fn()}
        isCheckingStatus={false}
      />
    );
    expect(screen.getByText('Click to Check')).toBeInTheDocument();
    expect(screen.getByText('(Click button below to check)')).toBeInTheDocument();
    expect(screen.getByText('Check Docker Status')).toBeInTheDocument();
  });

  it('renders running status and info', () => {
    const status = {
      isRunning: true,
      status: 'running',
      info: { containers: 2, images: 5, version: '24.0.5', os: 'linux', architecture: 'x86_64' },
    };
    render(
      <DockerButton
        dockerStatus={status}
        checkDockerStatus={jest.fn()}
        isCheckingStatus={false}
      />
    );
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Containers:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Images:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Version:')).toBeInTheDocument();
    expect(screen.getByText('24.0.5')).toBeInTheDocument();
    expect(screen.getByText('Refresh Status')).toBeInTheDocument();
  });

  it('renders stopped status', () => {
    render(
      <DockerButton
        dockerStatus={{ isRunning: false, status: 'stopped' }}
        checkDockerStatus={jest.fn()}
        isCheckingStatus={false}
      />
    );
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(screen.getByText('Refresh Status')).toBeInTheDocument();
  });

  it('renders not_accessible status', () => {
    render(
      <DockerButton
        dockerStatus={{ isRunning: false, status: 'not_accessible' }}
        checkDockerStatus={jest.fn()}
        isCheckingStatus={false}
      />
    );
    expect(screen.getByText('Not Accessible')).toBeInTheDocument();
  });

  it('renders not_installed status', () => {
    render(
      <DockerButton
        dockerStatus={{ isRunning: false, status: 'not_installed' }}
        checkDockerStatus={jest.fn()}
        isCheckingStatus={false}
      />
    );
    expect(screen.getByText('Not Installed')).toBeInTheDocument();
  });

  it('disables button and shows spinner when checking', () => {
    render(
      <DockerButton
        dockerStatus={baseStatus}
        checkDockerStatus={jest.fn()}
        isCheckingStatus={true}
      />
    );
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls checkDockerStatus on button click', async () => {
    const checkDockerStatus = jest.fn().mockResolvedValue(undefined);
    render(
      <DockerButton
        dockerStatus={baseStatus}
        checkDockerStatus={checkDockerStatus}
        isCheckingStatus={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(checkDockerStatus).toHaveBeenCalled());
  });

  it('shows toast success if running after check', async () => {
    const toast = require('react-hot-toast').default;
    const checkDockerStatus = jest.fn().mockResolvedValue(undefined);
    const status = { isRunning: true, status: 'running' };
    render(
      <DockerButton
        dockerStatus={status}
        checkDockerStatus={checkDockerStatus}
        isCheckingStatus={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(checkDockerStatus).toHaveBeenCalled());
    // Simulate post-check
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows toast error if not accessible after check', async () => {
    const toast = require('react-hot-toast').default;
    const checkDockerStatus = jest.fn().mockResolvedValue(undefined);
    const status = { isRunning: false, status: 'not_accessible' };
    render(
      <DockerButton
        dockerStatus={status}
        checkDockerStatus={checkDockerStatus}
        isCheckingStatus={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(checkDockerStatus).toHaveBeenCalled());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('shows toast error if check throws', async () => {
    const toast = require('react-hot-toast').default;
    const checkDockerStatus = jest.fn().mockRejectedValue(new Error('fail'));
    render(
      <DockerButton
        dockerStatus={baseStatus}
        checkDockerStatus={checkDockerStatus}
        isCheckingStatus={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(checkDockerStatus).toHaveBeenCalled());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to check Docker status'));
  });
}); 