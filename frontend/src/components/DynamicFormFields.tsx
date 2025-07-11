import React, { useMemo, useCallback } from 'react';
import { Database, Server, Key, User, Lock, Globe } from 'lucide-react';
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

const DynamicFormFields: React.FC<DynamicFormFieldsProps> = React.memo(({ 
  dbType, 
  register, 
  errors 
}) => {
  const getFieldsForDatabase = useCallback((): FieldConfig[] => {
    const baseFields: FieldConfig[] = [];
    
    switch (dbType) {
      case 'postgres':
      case 'mysql':
        baseFields.push(
          { name: 'host', label: 'Host', type: 'text', icon: Server, defaultValue: 'localhost', section: 'connection' },
          { name: 'port', label: 'Port', type: 'number', icon: Key, defaultValue: dbType === 'postgres' ? '5432' : '3306', section: 'connection' },
          { name: 'database', label: 'Database', type: 'text', icon: Database, required: false, section: 'connection' },
          { name: 'username', label: 'Username', type: 'text', icon: User, required: true, section: 'connection' },
          { name: 'password', label: 'Password', type: 'password', icon: Lock, required: true, section: 'connection' }
        );
        break;
      case 'mongodb':
        baseFields.push(
          { name: 'uri', label: 'Connection URI', type: 'text', icon: Globe, required: true, section: 'connection' },
          { name: 'database', label: 'Database', type: 'text', icon: Database, required: false, section: 'connection' }
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
          { name: 'database', label: 'Database File Path', type: 'text', icon: Database, required: false, section: 'connection' }
        );
        break;
    }
    
    // Add restore-specific fields for all database types
    baseFields.push(
      { name: 'restore_host', label: 'Restore Host (Optional)', type: 'text', icon: Server, defaultValue: 'localhost', section: 'restore' },
      { name: 'restore_port', label: 'Restore Port (Optional)', type: 'number', icon: Key, section: 'restore' },
      { name: 'local_database_name', label: 'Local Database Name (Optional)', type: 'text', icon: Database, section: 'restore' },
      { name: 'restore_username', label: 'Restore Username (Optional)', type: 'text', icon: User, section: 'restore' },
      { name: 'restore_password', label: 'Restore Password (Optional)', type: 'password', icon: Lock, section: 'restore' },
      { name: 'stack_name', label: 'Stack Name (Optional)', type: 'text', icon: Server, section: 'restore' }
    );
    
    return baseFields;
  }, [dbType]);

  const fields = useMemo(() => getFieldsForDatabase(), [getFieldsForDatabase]);
  const connectionFields = useMemo(() => fields.filter(field => field.section === 'connection'), [fields]);
  const restoreFields = useMemo(() => fields.filter(field => field.section === 'restore'), [fields]);

  const renderField = useCallback(({ name, label, type, icon: Icon, defaultValue, required }: FieldConfig) => {
    const inputId = `${name}-input`;
    return (
      <div key={name} className="field-group">
        <label className="field-label" htmlFor={inputId}>
          <Icon className="field-icon" />
          {label}
          {required && <span className="required">*</span>}
        </label>
        <div className="input-wrapper">
          <input
            id={inputId}
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
    );
  }, [register, errors]);

  return (
    <div className="dynamic-form-fields">
      {/* Connection Fields */}
      <div className="fields-section">
        <h3 className="section-title">Dump Database Connection</h3>
        <div className="fields-grid">
          {connectionFields.map(renderField)}
        </div>
      </div>

      {/* Restore Fields */}
      <div className="fields-section">
        <h3 className="section-title">Restore Database Connection</h3>
        <p className="section-description">
          These fields are used specifically for restore operations. Restore password is optional for authentication.
        </p>
        <div className="fields-grid">
          {restoreFields.map(renderField)}
        </div>
      </div>
    </div>
  );
});

DynamicFormFields.displayName = 'DynamicFormFields';

export default DynamicFormFields; 