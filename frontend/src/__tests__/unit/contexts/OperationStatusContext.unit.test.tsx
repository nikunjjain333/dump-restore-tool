import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OperationStatusProvider, useOperationStatus } from '../../../contexts/OperationStatusContext';

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { operationStatus, setOperationStatus, isRunning } = useOperationStatus();
  
  return (
    <div>
      <div data-testid="status-1">{operationStatus[1] || 'idle'}</div>
      <div data-testid="status-2">{operationStatus[2] || 'idle'}</div>
      <div data-testid="is-running-1">{isRunning(1) ? 'true' : 'false'}</div>
      <div data-testid="is-running-2">{isRunning(2) ? 'true' : 'false'}</div>
      <button 
        data-testid="set-running-1" 
        onClick={() => setOperationStatus(1, 'running')}
      >
        Set Running 1
      </button>
      <button 
        data-testid="set-success-1" 
        onClick={() => setOperationStatus(1, 'success')}
      >
        Set Success 1
      </button>
      <button 
        data-testid="set-error-2" 
        onClick={() => setOperationStatus(2, 'error')}
      >
        Set Error 2
      </button>
    </div>
  );
};

describe('OperationStatusContext', () => {
  it('provides initial empty operation status', () => {
    render(
      <OperationStatusProvider>
        <TestComponent />
      </OperationStatusProvider>
    );
    
    expect(screen.getByTestId('status-1')).toHaveTextContent('idle');
    expect(screen.getByTestId('status-2')).toHaveTextContent('idle');
    expect(screen.getByTestId('is-running-1')).toHaveTextContent('false');
    expect(screen.getByTestId('is-running-2')).toHaveTextContent('false');
  });

  it('updates operation status when setOperationStatus is called', () => {
    render(
      <OperationStatusProvider>
        <TestComponent />
      </OperationStatusProvider>
    );
    
    // Initially idle
    expect(screen.getByTestId('status-1')).toHaveTextContent('idle');
    expect(screen.getByTestId('is-running-1')).toHaveTextContent('false');
    
    // Set to running
    fireEvent.click(screen.getByTestId('set-running-1'));
    expect(screen.getByTestId('status-1')).toHaveTextContent('running');
    expect(screen.getByTestId('is-running-1')).toHaveTextContent('true');
    
    // Set to success
    fireEvent.click(screen.getByTestId('set-success-1'));
    expect(screen.getByTestId('status-1')).toHaveTextContent('success');
    expect(screen.getByTestId('is-running-1')).toHaveTextContent('false');
  });

  it('handles multiple configs independently', () => {
    render(
      <OperationStatusProvider>
        <TestComponent />
      </OperationStatusProvider>
    );
    
    // Set different statuses for different configs
    fireEvent.click(screen.getByTestId('set-running-1'));
    fireEvent.click(screen.getByTestId('set-error-2'));
    
    expect(screen.getByTestId('status-1')).toHaveTextContent('running');
    expect(screen.getByTestId('status-2')).toHaveTextContent('error');
    expect(screen.getByTestId('is-running-1')).toHaveTextContent('true');
    expect(screen.getByTestId('is-running-2')).toHaveTextContent('false');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useOperationStatus must be used within an OperationStatusProvider');
    
    consoleSpy.mockRestore();
  });
}); 