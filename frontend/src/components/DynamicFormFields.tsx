import React from 'react';
import { UseFormRegister, FieldErrors, FieldError } from 'react-hook-form';
import './DynamicFormFields.scss';

interface FormData {
  dbType: string;
  operation: 'dump' | 'restore';
  configName: string;
  dumpPath: string;
  restorePath: string;
  runPath: string;
  [key: string]: any;
}

interface DynamicFormFieldsProps {
  dbType: string;
  operation: string;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  defaultValue?: string;
  required: boolean;
}

const DynamicFormFields: React.FC<DynamicFormFieldsProps> = ({
  dbType,
  operation,
  register,
  errors
}) => {
  const getFieldsForDbType = (): FieldConfig[] => {
    switch (dbType) {
      case 'postgres':
        return [
          { name: 'host', label: 'Host', type: 'text', defaultValue: 'localhost', required: false },
          { name: 'port', label: 'Port', type: 'number', defaultValue: '5432', required: false },
          { name: 'database', label: 'Database', type: 'text', required: true },
          { name: 'username', label: 'Username', type: 'text', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true },
        ];
      case 'mysql':
        return [
          { name: 'host', label: 'Host', type: 'text', defaultValue: 'localhost', required: false },
          { name: 'port', label: 'Port', type: 'number', defaultValue: '3306', required: false },
          { name: 'database', label: 'Database', type: 'text', required: true },
          { name: 'username', label: 'Username', type: 'text', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true },
        ];
      case 'mongodb':
        return [
          { name: 'uri', label: 'Connection URI', type: 'text', required: true },
          { name: 'database', label: 'Database', type: 'text', required: true },
        ];
      case 'redis':
        return [
          { name: 'host', label: 'Host', type: 'text', defaultValue: 'localhost', required: false },
          { name: 'port', label: 'Port', type: 'number', defaultValue: '6379', required: false },
          { name: 'password', label: 'Password', type: 'password', required: false },
          { name: 'db', label: 'Database Number', type: 'number', defaultValue: '0', required: false },
        ];
      case 'sqlite':
        return [
          { name: 'database', label: 'Database File Path', type: 'text', required: true },
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForDbType();

  return (
    <div className="dynamic-form-fields">
      {fields.map((field) => {
        const error = errors[field.name];
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type={field.type}
              id={field.name}
              defaultValue={field.defaultValue}
              {...register(field.name, { 
                required: field.required ? `${field.label} is required` : false 
              })}
              className={error ? 'error' : ''}
            />
            {error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && (
              <span className="error-message">{error.message}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicFormFields; 