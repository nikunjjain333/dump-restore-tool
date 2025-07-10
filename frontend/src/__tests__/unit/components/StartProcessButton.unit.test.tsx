import React from 'react';
import { render, screen } from '@testing-library/react';
import StartProcessButton from '../../../components/StartProcessButton';
import { Download } from 'lucide-react';

describe('StartProcessButton', () => {
  it('renders with default label and icon', () => {
    render(<StartProcessButton isLoading={false} />);
    expect(screen.getByText('Start Process')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('renders with custom label and default icon', () => {
    render(<StartProcessButton isLoading={false} label="Dump" />);
    expect(screen.getByText('Dump')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('renders with custom label and custom icon', () => {
    render(<StartProcessButton isLoading={false} label="Download" icon={<Download data-testid="custom-icon" />} />);
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('shows loading state and disables button', () => {
    render(<StartProcessButton isLoading={true} label="Dump" />);
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state with default label', () => {
    render(<StartProcessButton isLoading={true} />);
    expect(screen.getByText('Starting process...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
}); 