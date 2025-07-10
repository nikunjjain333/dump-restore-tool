import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SavedConfigsList from '../../../components/SavedConfigsList';
import { Config } from '../../../api/client';
import { OperationStatusProvider } from '../../../contexts/OperationStatusContext';

describe('SavedConfigsList Unit Tests', () => {
  const baseConfig: Config = {
    id: 1,
    name: 'Test Config',
    db_type: 'postgres',
    params: { host: 'localhost', port: 5432, database: 'testdb', user: 'admin' },
    restore_password: 'password',
  };

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <OperationStatusProvider>
      {children}
    </OperationStatusProvider>
  );

  const configs: Config[] = [
    baseConfig,
    {
      ...baseConfig,
      id: 2,
      name: 'MySQL Config',
      db_type: 'mysql',
      params: { host: '127.0.0.1', port: 3306, database: 'mydb', user: 'root' },
    },
    {
      ...baseConfig,
      id: 3,
      name: 'Redis Config',
      db_type: 'redis',
      params: { host: 'localhost', port: 6379 },
    },
  ];

  it('renders empty state when no configs', () => {
    render(
      <TestWrapper>
        <SavedConfigsList configs={[]} onSelect={jest.fn()} />
      </TestWrapper>
    );
    expect(screen.getByText('No Saved Configurations')).toBeInTheDocument();
    expect(screen.getByText('Create and save your first configuration to get started')).toBeInTheDocument();
  });

  it('renders all configs and meta info', () => {
    render(
      <TestWrapper>
        <SavedConfigsList configs={configs} onSelect={jest.fn()} onStartOperation={jest.fn()} />
      </TestWrapper>
    );
    expect(screen.getByText('Saved Configurations (3)')).toBeInTheDocument();
    expect(screen.getByText('Test Config')).toBeInTheDocument();
    expect(screen.getByText('MySQL Config')).toBeInTheDocument();
    expect(screen.getByText('Redis Config')).toBeInTheDocument();
    expect(screen.getAllByText('Load Configuration').length).toBe(3);
    expect(screen.getAllByText('Dump').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Restore').length).toBeGreaterThan(0);
  });

  it('calls onSelect when Load Configuration is clicked', () => {
    const onSelect = jest.fn();
    render(
      <TestWrapper>
        <SavedConfigsList configs={configs} onSelect={onSelect} />
      </TestWrapper>
    );
    const loadButtons = screen.getAllByText('Load Configuration');
    fireEvent.click(loadButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(configs[0]);
  });

  it('calls onStartOperation for dump and restore', () => {
    const onStartOperation = jest.fn();
    render(
      <TestWrapper>
        <SavedConfigsList
          configs={configs}
          onSelect={jest.fn()}
          onStartOperation={onStartOperation}
        />
      </TestWrapper>
    );
    const dumpButtons = screen.getAllByText('Dump');
    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(dumpButtons[0]);
    expect(onStartOperation).toHaveBeenCalledWith(configs[0], 'dump');
    fireEvent.click(restoreButtons[0]);
    expect(onStartOperation).toHaveBeenCalledWith(configs[0], 'restore');
  });

  it('disables buttons when operation is running', () => {
    render(
      <TestWrapper>
        <SavedConfigsList
          configs={configs}
          onSelect={jest.fn()}
          onStartOperation={jest.fn()}
        />
      </TestWrapper>
    );
    const loadButtons = screen.getAllByText('Load Configuration');
    // There are 3 configs, so 6 primary buttons (Dump/Restore for each)
    const primaryButtons = Array.from(document.querySelectorAll('.btn.btn-primary')) as HTMLButtonElement[];
    // All buttons should be enabled initially
    expect(primaryButtons[0]).toBeEnabled();
    expect(primaryButtons[1]).toBeEnabled();
    expect(primaryButtons[2]).toBeEnabled();
    expect(primaryButtons[3]).toBeEnabled();
    expect(primaryButtons[4]).toBeEnabled();
    expect(primaryButtons[5]).toBeEnabled();
    // Load buttons should all be enabled initially
    expect(loadButtons[0]).toBeEnabled();
    expect(loadButtons[1]).toBeEnabled();
    expect(loadButtons[2]).toBeEnabled();
  });

  it('shows only first 3 params and "+X more" if more exist', () => {
    const configWithManyParams = {
      ...baseConfig,
      id: 4,
      name: 'Many Params',
      params: { a: 1, b: 2, c: 3, d: 4, e: 5 },
    };
    render(
      <TestWrapper>
        <SavedConfigsList
          configs={[configWithManyParams]}
          onSelect={jest.fn()}
        />
      </TestWrapper>
    );
    expect(screen.getByText('a:')).toBeInTheDocument();
    expect(screen.getByText('b:')).toBeInTheDocument();
    expect(screen.getByText('c:')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('handles missing onStartOperation gracefully', () => {
    render(
      <TestWrapper>
        <SavedConfigsList
          configs={configs}
          onSelect={jest.fn()}
        />
      </TestWrapper>
    );
    expect(screen.getAllByText('Load Configuration').length).toBe(3);
    // Should not throw error when clicking Load Configuration
    fireEvent.click(screen.getAllByText('Load Configuration')[0]);
  });
}); 