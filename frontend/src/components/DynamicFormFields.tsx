import React from 'react';
import { UseFormRegister, FieldErrors, FieldError } from 'react-hook-form';
import { 
  Server, 
  Database, 
  User, 
  Lock, 
  Hash, 
  FileText,
  Globe,
  Settings
} from 'lucide-react';
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
  icon: React.ReactNode;
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
          { name: 'host', label: 'Host', type: 'text', defaultValue: 'localhost', required: false, icon: <Server className="input-icon" /> },
          { name: 'port', label: 'Port', type: 'number', defaultValue: '5432', required: false, icon: <Hash className="input-icon" /> },
          { name: 'database', label: 'Database', type: 'text', required: true, icon: <Database className="input-icon" /> },
          { name: 'username', label: 'Username', type: 'text', required: true, icon: <User className="input-icon" /> },
          { name: 'password', label: 'Password', type: 'password', required: true, icon: <Lock className="input-icon" /> },
        ];
      case 'mysql':
        return [
          { name: 'host', label: 'Host', type: 'text', defaultValue: 'localhost', required: false, icon: <Server className="input-icon" /> },
          { name: 'port', label: 'Port', type: 'number', defaultValue: '3306', required: false, icon: <Hash className="input-icon" /> },
          { name: 'database', label: 'Database', type: 'text', required: true, icon: <Database className="input-icon" /> },
          { name: 'username', label: 'Username', type: 'text', required: true, icon: <User className="input-icon" /> },
          { name: 'password', label: 'Password', type: 'password', required: true, icon: <Lock className="input-icon" /> },
        ];
      case 'mongodb':
        return [
          { name: 'uri', label: 'Connection URI', type: 'text', required: true, icon: <Globe className="input-icon" /> },
          { name: 'database', label: 'Database', type: 'text', required: true, icon: <Database className="input-icon" /> },
        ];
      case 'redis':
        return [
          { name: 'host', label: 'Host', type: 'text', defaultValue: 'localhost', required: false, icon: <Server className="input-icon" /> },
          { name: 'port', label: 'Port', type: 'number', defaultValue: '6379', required: false, icon: <Hash className="input-icon" /> },
          { name: 'password', label: 'Password', type: 'password', required: false, icon: <Lock className="input-icon" /> },
          { name: 'db', label: 'Database Number', type: 'number', defaultValue: '0', required: false, icon: <Settings className="input-icon" /> },
        ];
      case 'sqlite':
        return [
          { name: 'database', label: 'Database File Path', type: 'text', required: true, icon: <FileText className="input-icon" /> },
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForDbType();

  return (
    <div className="dynamic-form-fields">
      <div className="form-grid">
        {fields.map((field) => {
          const error = errors[field.name];
          return (
            <div key={field.name} className="form-field">
              <label htmlFor={field.name} className="field-label">{field.label}</label>
              <div className="input-wrapper">
                {field.icon}
                <input
                  type={field.type}
                  id={field.name}
                  defaultValue={field.defaultValue}
                  {...register(field.name, { 
                    required: field.required ? `${field.label} is required` : false 
                  })}
                  className={`input ${error ? 'error' : ''}`}
                />
              </div>
              {error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && (
                <div className="field-error">
                  <span>⚠️</span>
                  {error.message}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicFormFields; 