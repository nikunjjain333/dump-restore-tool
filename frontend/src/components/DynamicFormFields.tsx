import React from 'react';
import { Database, Server, Key, User, Lock, Globe } from 'lucide-react';
import './DynamicFormFields.scss';

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  icon: React.ComponentType<any>;
  defaultValue?: string;
  required?: boolean;
}

interface DynamicFormFieldsProps {
  dbType: string;
  register: any;
  errors: any;
}

const DynamicFormFields: React.FC<DynamicFormFieldsProps> = ({ 
  dbType, 
  register, 
  errors 
}) => {
  const getFieldsForDatabase = (): FieldConfig[] => {
    switch (dbType) {
      case 'postgres':
      case 'mysql':
        return [
          { name: 'host', label: 'Host', type: 'text', icon: Server, defaultValue: 'localhost' },
          { name: 'port', label: 'Port', type: 'number', icon: Key, defaultValue: dbType === 'postgres' ? '5432' : '3306' },
          { name: 'database', label: 'Database', type: 'text', icon: Database, required: true },
          { name: 'username', label: 'Username', type: 'text', icon: User, required: true },
          { name: 'password', label: 'Password', type: 'password', icon: Lock, required: true }
        ];
      case 'mongodb':
        return [
          { name: 'uri', label: 'Connection URI', type: 'text', icon: Globe, required: true },
          { name: 'database', label: 'Database', type: 'text', icon: Database, required: true }
        ];
      case 'redis':
        return [
          { name: 'host', label: 'Host', type: 'text', icon: Server, defaultValue: 'localhost' },
          { name: 'port', label: 'Port', type: 'number', icon: Key, defaultValue: '6379' },
          { name: 'password', label: 'Password', type: 'password', icon: Lock },
          { name: 'db', label: 'Database Number', type: 'number', icon: Database, defaultValue: '0' }
        ];
      case 'sqlite':
        return [
          { name: 'database', label: 'Database File Path', type: 'text', icon: Database, required: true }
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForDatabase();

  return (
    <div className="dynamic-form-fields">
      <div className="fields-grid">
        {fields.map(({ name, label, type, icon: Icon, defaultValue, required }) => (
          <div key={name} className="field-group">
            <label className="field-label">
              <Icon className="field-icon" />
              {label}
              {required && <span className="required">*</span>}
            </label>
            <div className="input-wrapper">
              <input
                type={type}
                {...register(name, { 
                  required: required ? `${label} is required` : false,
                  value: defaultValue || ''
                })}
                className={`field-input ${errors[name] ? 'error' : ''}`}
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            </div>
            {errors[name] && (
              <div className="field-error">
                <span className="error-icon">⚠</span>
                {errors[name]?.message || 'This field is required'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicFormFields; 