import React from 'react';
import { render, screen } from '@testing-library/react';
import DynamicFormFields from '../../../components/DynamicFormFields';

describe('DynamicFormFields', () => {
  const register = (name: string, opts: any) => ({
    name,
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
    ...opts,
  });

  it('renders postgres fields', () => {
    render(<DynamicFormFields dbType="postgres" register={register} errors={{}} />);
    expect(screen.getByLabelText(/^Host/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Port/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Database/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Restore Host/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Restore Port/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Local Database Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Restore Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Restore Password/)).toBeInTheDocument();
  });

  it('renders mysql fields', () => {
    render(<DynamicFormFields dbType="mysql" register={register} errors={{}} />);
    expect(screen.getByLabelText(/^Host/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Port/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Database/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
  });

  it('renders mongodb fields', () => {
    render(<DynamicFormFields dbType="mongodb" register={register} errors={{}} />);
    expect(screen.getByLabelText(/^Connection URI/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Database/)).toBeInTheDocument();
  });

  it('renders redis fields', () => {
    render(<DynamicFormFields dbType="redis" register={register} errors={{}} />);
    expect(screen.getByLabelText(/^Host/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Port/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Database Number/)).toBeInTheDocument();
  });

  it('renders sqlite fields', () => {
    render(<DynamicFormFields dbType="sqlite" register={register} errors={{}} />);
    expect(screen.getByLabelText(/^Database File Path/)).toBeInTheDocument();
  });

  it('shows error messages for fields', () => {
    const errors = {
      host: { message: 'Host required' },
      restore_password: { message: 'Restore password required' },
    };
    render(<DynamicFormFields dbType="postgres" register={register} errors={errors} />);
    expect(screen.getByText('Host required')).toBeInTheDocument();
    expect(screen.getByText('Restore password required')).toBeInTheDocument();
  });

  it('shows default error message if message is missing', () => {
    const errors = { host: {} };
    render(<DynamicFormFields dbType="postgres" register={register} errors={errors} />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
}); 