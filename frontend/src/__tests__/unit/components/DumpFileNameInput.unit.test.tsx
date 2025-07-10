import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DumpFileNameInput from '../../../components/DumpFileNameInput';

describe('DumpFileNameInput', () => {
  it('renders with default props', () => {
    render(<DumpFileNameInput value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText(/Dump File Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter filename/)).toBeInTheDocument();
    expect(screen.getByText(/The backend will automatically add/)).toBeInTheDocument();
  });

  it('shows error message if error prop is set', () => {
    render(<DumpFileNameInput value="" onChange={jest.fn()} error="Invalid filename" />);
    expect(screen.getByText('Invalid filename')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('input-error');
  });

  it('calls onChange with sanitized value (removes extension and special chars)', () => {
    const onChange = jest.fn();
    render(<DumpFileNameInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'myfile.sql' } });
    expect(onChange).toHaveBeenCalledWith('myfile');
    fireEvent.change(input, { target: { value: 'weird@file!.db' } });
    expect(onChange).toHaveBeenCalledWith('weird_file');
    fireEvent.change(input, { target: { value: '__foo__bar__' } });
    expect(onChange).toHaveBeenCalledWith('foo_bar');
    fireEvent.change(input, { target: { value: 'a..b..c' } });
    expect(onChange).toHaveBeenCalledWith('a_b_c');
  });

  it('uses custom placeholder if provided', () => {
    render(<DumpFileNameInput value="" onChange={jest.fn()} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('renders with a value', () => {
    render(<DumpFileNameInput value="myfile" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('myfile')).toBeInTheDocument();
  });
}); 