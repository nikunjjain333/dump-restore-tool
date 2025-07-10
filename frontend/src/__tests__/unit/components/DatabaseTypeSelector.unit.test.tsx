import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import DatabaseTypeSelector from '../../../components/DatabaseTypeSelector';

// Mock react-hook-form
const mockRegister = jest.fn();
const mockOnChange = jest.fn();

// Test wrapper component to provide form context
const TestWrapper: React.FC<{ 
  value: string; 
  onChange: (value: string) => void; 
  errors?: any;
}> = ({ value, onChange, errors = {} }) => {
  const { register } = useForm();
  
  return (
    <DatabaseTypeSelector
      value={value}
      onChange={onChange}
      register={register}
      errors={errors}
    />
  );
};

describe('DatabaseTypeSelector Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all database type options', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('MySQL')).toBeInTheDocument();
      expect(screen.getByText('MongoDB')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();
      expect(screen.getByText('SQLite')).toBeInTheDocument();
    });

    it('should render with correct database types and values', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const postgresRadio = screen.getByDisplayValue('postgres');
      const mysqlRadio = screen.getByDisplayValue('mysql');
      const mongodbRadio = screen.getByDisplayValue('mongodb');
      const redisRadio = screen.getByDisplayValue('redis');
      const sqliteRadio = screen.getByDisplayValue('sqlite');

      expect(postgresRadio).toBeInTheDocument();
      expect(mysqlRadio).toBeInTheDocument();
      expect(mongodbRadio).toBeInTheDocument();
      expect(redisRadio).toBeInTheDocument();
      expect(sqliteRadio).toBeInTheDocument();
    });

    it('should show selected database type with correct styling', () => {
      render(
        <TestWrapper 
          value="postgres" 
          onChange={mockOnChange}
        />
      );

      const postgresCard = screen.getByDisplayValue('postgres').closest('label');
      expect(postgresCard).toHaveClass('selected');
    });

    it('should not show selected styling for unselected options', () => {
      render(
        <TestWrapper 
          value="postgres" 
          onChange={mockOnChange}
        />
      );

      const mysqlCard = screen.getByDisplayValue('mysql').closest('label');
      expect(mysqlCard).not.toHaveClass('selected');
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when a database type is selected', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const mysqlRadio = screen.getByDisplayValue('mysql');
      fireEvent.click(mysqlRadio);

      expect(mockOnChange).toHaveBeenCalledWith('mysql');
    });

    it('should call onChange with correct value for each database type', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const databaseTypes = ['postgres', 'mysql', 'mongodb', 'redis', 'sqlite'];

      databaseTypes.forEach(dbType => {
        const radio = screen.getByDisplayValue(dbType);
        fireEvent.click(radio);
        expect(mockOnChange).toHaveBeenCalledWith(dbType);
      });
    });

    it('should handle multiple selections correctly', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      // Select first option
      const postgresRadio = screen.getByDisplayValue('postgres');
      fireEvent.click(postgresRadio);
      expect(mockOnChange).toHaveBeenCalledWith('postgres');

      // Select second option
      const mysqlRadio = screen.getByDisplayValue('mysql');
      fireEvent.click(mysqlRadio);
      expect(mockOnChange).toHaveBeenCalledWith('mysql');

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Form Integration', () => {
    it('should register with react-hook-form correctly', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const postgresRadio = screen.getByDisplayValue('postgres');
      expect(postgresRadio).toHaveAttribute('name', 'dbType');
    });

    it('should show error message when validation fails', () => {
      const errors = {
        dbType: {
          message: 'Please select a database type'
        }
      };

      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
          errors={errors}
        />
      );

      expect(screen.getByText('Please select a database type')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('should not show error message when no errors exist', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Please select a database type')).not.toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });

    it('should show error message with different error text', () => {
      const errors = {
        dbType: {
          message: 'Database type is required'
        }
      };

      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
          errors={errors}
        />
      );

      expect(screen.getByText('Database type is required')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for screen readers', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('MySQL')).toBeInTheDocument();
    });

    it('should have radio inputs with proper attributes', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const postgresRadio = screen.getByDisplayValue('postgres');
      expect(postgresRadio).toHaveAttribute('type', 'radio');
      expect(postgresRadio).toHaveAttribute('value', 'postgres');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value prop', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      // Should render without errors
      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      expect(screen.getByDisplayValue('postgres')).toBeInTheDocument();
    });

    it('should handle invalid value prop', () => {
      render(
        <TestWrapper 
          value="invalid-db-type" 
          onChange={mockOnChange}
        />
      );

      // Should render without errors, no option should be selected
      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      const postgresCard = screen.getByDisplayValue('postgres').closest('label');
      expect(postgresCard).not.toHaveClass('selected');
    });

    it('should handle undefined errors prop', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
          errors={undefined}
        />
      );

      // Should render without errors
      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });

    it('should handle empty errors object', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
          errors={{}}
        />
      );

      // Should render without errors
      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct CSS classes', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const container = screen.getByText('Select Database Type').closest('.database-type-selector');
      expect(container).toBeInTheDocument();

      const optionsGrid = container?.querySelector('.options-grid');
      expect(optionsGrid).toBeInTheDocument();
    });

    it('should have option cards with correct structure', () => {
      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
        />
      );

      const postgresCard = screen.getByDisplayValue('postgres').closest('label');
      expect(postgresCard).toHaveClass('option-card');

      const optionContent = postgresCard?.querySelector('.option-content');
      expect(optionContent).toBeInTheDocument();

      const optionIcon = postgresCard?.querySelector('.option-icon');
      expect(optionIcon).toBeInTheDocument();

      const optionLabel = postgresCard?.querySelector('.option-label');
      expect(optionLabel).toBeInTheDocument();
    });

    it('should have error message with correct structure when error exists', () => {
      const errors = {
        dbType: {
          message: 'Please select a database type'
        }
      };

      render(
        <TestWrapper 
          value="" 
          onChange={mockOnChange}
          errors={errors}
        />
      );

      const errorMessage = screen.getByText('Please select a database type').closest('.error-message');
      expect(errorMessage).toBeInTheDocument();

      const errorIcon = errorMessage?.querySelector('.error-icon');
      expect(errorIcon).toBeInTheDocument();
    });
  });
}); 