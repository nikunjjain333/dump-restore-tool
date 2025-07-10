import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SavedConfigsList from '../../../components/SavedConfigsList';
import { Config } from '../../../api/client';

describe('SavedConfigsList Unit Tests', () => {
  const baseConfig: Config = {
    id: 1,
    name: 'Test Config',
    db_type: 'postgres',
    params: { host: 'localhost', port: 5432, database: 'testdb', user: 'admin' },
    restore_password: 'password',
  };

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
    render(<SavedConfigsList configs={[]} onSelect={jest.fn()} />);
    expect(screen.getByText('No Saved Configurations')).toBeInTheDocument();
    expect(screen.getByText('Create and save your first configuration to get started')).toBeInTheDocument();
  });

  it('renders all configs and meta info', () => {
    render(<SavedConfigsList configs={configs} onSelect={jest.fn()} onStartOperation={jest.fn()} />);
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
    render(<SavedConfigsList configs={configs} onSelect={onSelect} />);
    const loadButtons = screen.getAllByText('Load Configuration');
    fireEvent.click(loadButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(configs[0]);
  });

  it('calls onStartOperation for dump and restore', () => {
    const onStartOperation = jest.fn();
    render(
      <SavedConfigsList
        configs={configs}
        onSelect={jest.fn()}
        onStartOperation={onStartOperation}
      />
    );
    const dumpButtons = screen.getAllByText('Dump');
    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(dumpButtons[0]);
    expect(onStartOperation).toHaveBeenCalledWith(configs[0], 'dump');
    fireEvent.click(restoreButtons[0]);
    expect(onStartOperation).toHaveBeenCalledWith(configs[0], 'restore');
  });

  it('disables buttons when operation is running', () => {
    const operationStatus = { 1: 'running' as const };
    render(
      <SavedConfigsList
        configs={configs}
        onSelect={jest.fn()}
        onStartOperation={jest.fn()}
        operationStatus={operationStatus}
      />
    );
    const loadButtons = screen.getAllByText('Load Configuration');
    // There are 3 configs, so 6 primary buttons (Dump/Restore for each)
    const primaryButtons = Array.from(document.querySelectorAll('.btn.btn-primary')) as HTMLButtonElement[];
    // First two are for config 1, should be disabled
    expect(primaryButtons[0]).toBeDisabled();
    expect(primaryButtons[1]).toBeDisabled();
    // The rest should be enabled
    expect(primaryButtons[2]).toBeEnabled();
    expect(primaryButtons[3]).toBeEnabled();
    expect(primaryButtons[4]).toBeEnabled();
    expect(primaryButtons[5]).toBeEnabled();
    // Load buttons: only the first should be disabled
    expect(loadButtons[0]).toBeDisabled();
    expect(loadButtons[1]).toBeEnabled();
    expect(loadButtons[2]).toBeEnabled();
    // There should be 3 'Running...' elements: status + 2 buttons
    expect(screen.getAllByText('Running...').length).toBe(3);
  });

  it('shows success and error status', () => {
    const operationStatus = { 1: 'success' as const, 2: 'error' as const };
    render(
      <SavedConfigsList
        configs={configs}
        onSelect={jest.fn()}
        onStartOperation={jest.fn()}
        operationStatus={operationStatus}
      />
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows only first 3 params and "+X more" if more exist', () => {
    const configWithManyParams = {
      ...baseConfig,
      id: 4,
      name: 'Many Params',
      params: { a: 1, b: 2, c: 3, d: 4, e: 5 },
    };
    render(
      <SavedConfigsList
        configs={[configWithManyParams]}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText('a:')).toBeInTheDocument();
    expect(screen.getByText('b:')).toBeInTheDocument();
    expect(screen.getByText('c:')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('handles missing onStartOperation gracefully', () => {
    render(
      <SavedConfigsList
        configs={configs}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getAllByText('Load Configuration').length).toBe(3);
    // Should not throw error when clicking Load Configuration
    fireEvent.click(screen.getAllByText('Load Configuration')[0]);
  });
}); 