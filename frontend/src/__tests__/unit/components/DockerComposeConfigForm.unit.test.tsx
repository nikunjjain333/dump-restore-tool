import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DockerComposeConfigForm from '../../../components/DockerComposeConfigForm';

describe('DockerComposeConfigForm', () => {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields and buttons', () => {
    render(<DockerComposeConfigForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText('Configuration Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Docker Compose Path *')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Docker Compose Flags')).toBeInTheDocument();
    expect(screen.getByText('Add Configuration')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    render(<DockerComposeConfigForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Add Configuration'));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Path is required')).toBeInTheDocument();
    });
  });

  it('shows minLength error for name', async () => {
    render(<DockerComposeConfigForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Configuration Name *'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByText('Add Configuration'));
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('submits correct data and resets form', async () => {
    render(<DockerComposeConfigForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Configuration Name *'), { target: { value: 'My Config' } });
    fireEvent.change(screen.getByLabelText('Docker Compose Path *'), { target: { value: '/tmp/docker-compose.yml' } });
    fireEvent.change(screen.getByLabelText('Service Name (Optional)'), { target: { value: 'web' } });
    fireEvent.change(screen.getByLabelText('Description (Optional)'), { target: { value: 'desc' } });
    // Uncheck detach, check build and pull
    fireEvent.click(screen.getByLabelText('Detach (run in background)'));
    fireEvent.click(screen.getByLabelText('Build images before starting'));
    fireEvent.click(screen.getByLabelText('Pull latest images'));
    fireEvent.click(screen.getByText('Add Configuration'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'My Config',
        path: '/tmp/docker-compose.yml',
        service_name: 'web',
        description: 'desc',
        flags: { build: true, pull: true },
      });
    });
    // Form should reset (fields empty)
    expect(screen.getByLabelText('Configuration Name *')).toHaveValue('');
    expect(screen.getByLabelText('Docker Compose Path *')).toHaveValue('');
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<DockerComposeConfigForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables inputs and buttons when loading', () => {
    render(<DockerComposeConfigForm onSubmit={onSubmit} onCancel={onCancel} loading={true} />);
    expect(screen.getByLabelText('Configuration Name *')).toBeDisabled();
    expect(screen.getByLabelText('Docker Compose Path *')).toBeDisabled();
    expect(screen.getByLabelText('Service Name (Optional)')).toBeDisabled();
    expect(screen.getByLabelText('Description (Optional)')).toBeDisabled();
    expect(screen.getByText('Adding...')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('shows error message if onFormSubmit throws', async () => {
    // Simulate error by making onSubmit throw
    const errorSubmit = jest.fn(() => { throw new Error('fail'); });
    render(<DockerComposeConfigForm onSubmit={errorSubmit} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Configuration Name *'), { target: { value: 'My Config' } });
    fireEvent.change(screen.getByLabelText('Docker Compose Path *'), { target: { value: '/tmp/docker-compose.yml' } });
    fireEvent.click(screen.getByText('Add Configuration'));
    await waitFor(() => {
      expect(screen.getByText('Failed to create configuration')).toBeInTheDocument();
    });
  });
}); 