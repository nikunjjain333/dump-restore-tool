import React from 'react';
import Select from 'react-select';
import { 
  Database, 
  Server, 
  HardDrive, 
  Zap, 
  FileText 
} from 'lucide-react';
import './DatabaseTypeSelector.scss';

interface DatabaseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  register: any;
  errors: any;
}

const databaseOptions = [
  { 
    value: 'postgres', 
    label: 'PostgreSQL',
    icon: <Database className="option-icon" />
  },
  { 
    value: 'mysql', 
    label: 'MySQL',
    icon: <Server className="option-icon" />
  },
  { 
    value: 'mongodb', 
    label: 'MongoDB',
    icon: <Database className="option-icon" />
  },
  { 
    value: 'redis', 
    label: 'Redis',
    icon: <Zap className="option-icon" />
  },
  { 
    value: 'sqlite', 
    label: 'SQLite',
    icon: <FileText className="option-icon" />
  },
];

const DatabaseTypeSelector: React.FC<DatabaseTypeSelectorProps> = ({
  value,
  onChange,
  register,
  errors
}) => {
  const selectedOption = databaseOptions.find(option => option.value === value);

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: 'var(--bg-input)',
      borderColor: state.isFocused ? 'var(--border-accent)' : 'var(--border-primary)',
      borderWidth: '1px',
      borderRadius: 'var(--radius-md)',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: 'var(--border-accent)',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'var(--bg-tertiary)' : 'transparent',
      color: 'var(--text-primary)',
      '&:hover': {
        backgroundColor: 'var(--bg-tertiary)',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'var(--text-primary)',
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'var(--text-primary)',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'var(--text-muted)',
    }),
  };

  const formatOptionLabel = ({ label, icon }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="database-type-selector">
      <label htmlFor="dbType" className="field-label">Database Type</label>
      <Select
        id="dbType"
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        options={databaseOptions}
        placeholder="Select database type..."
        isClearable
        className={errors.dbType ? 'error' : ''}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        classNamePrefix="select"
      />
      {errors.dbType && (
        <div className="field-error">
          <span>⚠️</span>
          {errors.dbType.message}
        </div>
      )}
    </div>
  );
};

export default DatabaseTypeSelector; 