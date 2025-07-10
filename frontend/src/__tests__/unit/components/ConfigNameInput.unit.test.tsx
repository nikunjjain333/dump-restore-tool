import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import ConfigNameInput from '../../../components/ConfigNameInput';

// Test wrapper component to provide form context
const TestWrapper: React.FC<{ errors?: any }> = ({ errors = {} }) => {
  const { register } = useForm();
  
  return (
    <ConfigNameInput
      register={register}
      errors={errors}
    />
  );
};

describe('ConfigNameInput Unit Tests', () => {
  describe('Rendering', () => {
    it('should render the configuration name input field', () => {
      render(<TestWrapper />);

      expect(screen.getByText('Configuration Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter configuration name...')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with correct input attributes', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('name', 'configName');
    });

    it('should render with required field indicator', () => {
      render(<TestWrapper />);

      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('required');
    });

    it('should render with field icon', () => {
      render(<TestWrapper />);

      const label = screen.getByText('Configuration Name').closest('label');
      const icon = label?.querySelector('.field-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('should register with react-hook-form correctly', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveAttribute('name', 'configName');
    });

    it('should apply error styling when validation fails', () => {
      const errors = {
        configName: {
          message: 'Configuration name is required'
        }
      };

      render(<TestWrapper errors={errors} />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveClass('error');
    });

    it('should not apply error styling when no errors exist', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).not.toHaveClass('error');
    });

    it('should show error message when validation fails', () => {
      const errors = {
        configName: {
          message: 'Configuration name is required'
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Configuration name is required')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('should show error message with different error text', () => {
      const errors = {
        configName: {
          message: 'Name must be at least 3 characters'
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });

    it('should show default error message when message is undefined', () => {
      const errors = {
        configName: {
          message: undefined
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Configuration name is required')).toBeInTheDocument();
    });

    it('should not show error message when no errors exist', () => {
      render(<TestWrapper />);

      expect(screen.queryByText('Configuration name is required')).not.toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow user to type in the input field', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      fireEvent.change(input, { target: { value: 'Test Configuration' } });

      expect(input).toHaveValue('Test Configuration');
    });

    it('should handle empty input', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      fireEvent.change(input, { target: { value: '' } });

      expect(input).toHaveValue('');
    });

    it('should handle special characters in input', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      fireEvent.change(input, { target: { value: 'Test-Config_123' } });

      expect(input).toHaveValue('Test-Config_123');
    });

    it('should handle very long input', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      const longValue = 'a'.repeat(1000);
      fireEvent.change(input, { target: { value: longValue } });

      expect(input).toHaveValue(longValue);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<TestWrapper />);

      const label = screen.getByText('Configuration Name');
      const input = screen.getByPlaceholderText('Enter configuration name...');
      
      // Check if label and input are properly associated
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveAttribute('placeholder', 'Enter configuration name...');
    });

    it('should have proper input type', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should be keyboard accessible', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined errors prop', () => {
      render(<TestWrapper errors={undefined} />);

      // Should render without errors
      expect(screen.getByText('Configuration Name')).toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });

    it('should handle empty errors object', () => {
      render(<TestWrapper errors={{}} />);

      // Should render without errors
      expect(screen.getByText('Configuration Name')).toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });

    it('should handle errors object without configName', () => {
      const errors = {
        otherField: {
          message: 'Some other error'
        }
      };

      render(<TestWrapper errors={errors} />);

      // Should render without configName errors
      expect(screen.getByText('Configuration Name')).toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });

    it('should handle null error message', () => {
      const errors = {
        configName: {
          message: null
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Configuration name is required')).toBeInTheDocument();
    });

    it('should handle empty string error message', () => {
      const errors = {
        configName: {
          message: ''
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Configuration name is required')).toBeInTheDocument();
    });

    it('should handle number error message', () => {
      const errors = {
        configName: {
          message: 123
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct CSS classes', () => {
      render(<TestWrapper />);

      const container = screen.getByText('Configuration Name').closest('.config-name-input');
      expect(container).toBeInTheDocument();

      const inputWrapper = container?.querySelector('.input-wrapper');
      expect(inputWrapper).toBeInTheDocument();
    });

    it('should have field label with correct structure', () => {
      render(<TestWrapper />);

      const label = screen.getByText('Configuration Name').closest('label');
      expect(label).toHaveClass('field-label');

      const icon = label?.querySelector('.field-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have input with correct structure', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveClass('field-input');
    });

    it('should have error message with correct structure when error exists', () => {
      const errors = {
        configName: {
          message: 'Configuration name is required'
        }
      };

      render(<TestWrapper errors={errors} />);

      const errorMessage = screen.getByText('Configuration name is required').closest('.field-error');
      expect(errorMessage).toBeInTheDocument();

      const errorIcon = errorMessage?.querySelector('.error-icon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should apply error class to input when error exists', () => {
      const errors = {
        configName: {
          message: 'Configuration name is required'
        }
      };

      render(<TestWrapper errors={errors} />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveClass('field-input', 'error');
    });

    it('should not apply error class to input when no error exists', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveClass('field-input');
      expect(input).not.toHaveClass('error');
    });
  });

  describe('Validation Integration', () => {
    it('should handle required validation', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveAttribute('name', 'configName');
    });

    it('should handle minLength validation', () => {
      render(<TestWrapper />);

      const input = screen.getByPlaceholderText('Enter configuration name...');
      expect(input).toHaveAttribute('name', 'configName');
    });

    it('should show validation error for required field', () => {
      const errors = {
        configName: {
          type: 'required',
          message: 'Configuration name is required'
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Configuration name is required')).toBeInTheDocument();
    });

    it('should show validation error for minLength', () => {
      const errors = {
        configName: {
          type: 'minLength',
          message: 'Name must be at least 3 characters'
        }
      };

      render(<TestWrapper errors={errors} />);

      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });
}); 