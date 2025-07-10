import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Modal from '../../../components/Modal';

describe('Modal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={jest.fn()} title="T" message="M" />);
    expect(screen.queryByText('T')).not.toBeInTheDocument();
  });

  it('renders with default info type and text content', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Info Title" message="Info message" />);
    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders with all types and correct icons', () => {
    const types = [
      { type: 'success', icon: '✅' },
      { type: 'error', icon: '❌' },
      { type: 'warning', icon: '⚠️' },
      { type: 'status', icon: '📊' },
      { type: 'info', icon: 'ℹ️' },
    ];
    types.forEach(({ type, icon }) => {
      render(<Modal isOpen={true} onClose={jest.fn()} title={type} message={type} type={type as any} />);
      expect(screen.getByText(icon)).toBeInTheDocument();
      expect(screen.getAllByText(type).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders with logs and preformatted content types', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Logs" message="log content" contentType="logs" />);
    expect(screen.getByText('log content')).toBeInTheDocument();
    render(<Modal isOpen={true} onClose={jest.fn()} title="Pre" message="pre content" contentType="preformatted" />);
    expect(screen.getByText('pre content')).toBeInTheDocument();
  });

  it('calls onClose when overlay or close button is clicked', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="T" message="M" />);
    fireEvent.click(screen.getByText('OK'));
    expect(onClose).toHaveBeenCalled();
    // Show close button
    render(<Modal isOpen={true} onClose={onClose} title="T" message="M" showCloseButton={true} />);
    fireEvent.click(screen.getAllByText('×')[0]);
    expect(onClose).toHaveBeenCalled();
    // Overlay click
    const dialog = screen.getAllByRole('dialog')[0];
    fireEvent.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not show close button if showCloseButton is false', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="T" message="M" showCloseButton={false} />);
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm is clicked', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Confirm"
        message="Are you sure?"
        onConfirm={onConfirm}
        confirmText="Yes"
        cancelText="No"
      />
    );
    fireEvent.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(screen.getByText('No'));
    expect(onClose).toHaveBeenCalled();
  });

  it('auto closes after delay if autoClose is true', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="T" message="M" autoClose={true} autoCloseDelay={1000} />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onClose).toHaveBeenCalled();
  });
}); 