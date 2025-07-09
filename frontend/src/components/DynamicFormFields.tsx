import React from 'react';
import { Database, Server, Key, User, Lock, Globe, Shield, Home } from 'lucide-react';
import './DynamicFormFields.scss';

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  icon: React.ComponentType<any>;
  defaultValue?: string;
  required?: boolean;
  section?: string;
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
    const baseFields: FieldConfig[] = [];
    
    switch (dbType) {
      case 'postgres':
      case 'mysql':
        baseFields.push(
          { name: 'host', label: 'Host', type: 'text', icon: Server, defaultValue: 'localhost', section: 'connection' },
          { name: 'port', label: 'Port', type: 'number', icon: Key, defaultValue: dbType === 'postgres' ? '5432' : '3306', section: 'connection' },
          { name: 'database', label: 'Database', type: 'text', icon: Database, required: true, section: 'connection' },
          { name: 'username', label: 'Username', type: 'text', icon: User, required: true, section: 'connection' },
          { name: 'password', label: 'Password', type: 'password', icon: Lock, required: true, section: 'connection' }
        );
        break;
      case 'mongodb':
        baseFields.push(
          { name: 'uri', label: 'Connection URI', type: 'text', icon: Globe, required: true, section: 'connection' },
          { name: 'database', label: 'Database', type: 'text', icon: Database, required: true, section: 'connection' }
        );
        break;
      case 'redis':
        baseFields.push(
          { name: 'host', label: 'Host', type: 'text', icon: Server, defaultValue: 'localhost', section: 'connection' },
          { name: 'port', label: 'Port', type: 'number', icon: Key, defaultValue: '6379', section: 'connection' },
          { name: 'password', label: 'Password', type: 'password', icon: Lock, section: 'connection' },
          { name: 'db', label: 'Database Number', type: 'number', icon: Database, defaultValue: '0', section: 'connection' }
        );
        break;
      case 'sqlite':
        baseFields.push(
          { name: 'database', label: 'Database File Path', type: 'text', icon: Database, required: true, section: 'connection' }
        );
        break;
    }
    
    // Add restore-specific fields for all database types
    baseFields.push(
      { name: 'restore_password', label: 'Restore Password', type: 'password', icon: Shield, required: true, section: 'restore' },
      { name: 'local_database_name', label: 'Local Database Name (Optional)', type: 'text', icon: Home, section: 'restore' },
      { name: 'restore_username', label: 'Restore Username (Optional)', type: 'text', icon: User, section: 'restore' }
    );
    
    return baseFields;
  };

  const fields = getFieldsForDatabase();
  const connectionFields = fields.filter(field => field.section === 'connection');
  const restoreFields = fields.filter(field => field.section === 'restore');

  return (
    <div className="dynamic-form-fields">
      {/* Connection Fields */}
      <div className="fields-section">
        <h3 className="section-title">Database Connection</h3>
        <div className="fields-grid">
          {connectionFields.map(({ name, label, type, icon: Icon, defaultValue, required }) => (
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
                  {errors[name]?.message?.toString() || 'This field is required'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Restore Fields */}
      <div className="fields-section">
        <h3 className="section-title">Restore Options</h3>
        <p className="section-description">
          These fields are used specifically for restore operations. Restore password is required for authentication.
        </p>
        <div className="fields-grid">
          {restoreFields.map(({ name, label, type, icon: Icon, defaultValue, required }) => (
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
                  {errors[name]?.message?.toString() || 'This field is required'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicFormFields; 