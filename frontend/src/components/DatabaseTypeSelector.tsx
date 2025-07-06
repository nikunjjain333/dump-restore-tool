import React from 'react';
import Select from 'react-select';
import './DatabaseTypeSelector.scss';

interface DatabaseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  register: any;
  errors: any;
}

const databaseOptions = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'sqlite', label: 'SQLite' },
];

const DatabaseTypeSelector: React.FC<DatabaseTypeSelectorProps> = ({
  value,
  onChange,
  register,
  errors
}) => {
  const selectedOption = databaseOptions.find(option => option.value === value);

  return (
    <div className="database-type-selector">
      <label htmlFor="dbType">Database Type</label>
      <Select
        id="dbType"
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        options={databaseOptions}
        placeholder="Select database type..."
        isClearable
        className={errors.dbType ? 'error' : ''}
      />
      {errors.dbType && <span className="error-message">{errors.dbType.message}</span>}
    </div>
  );
};

export default DatabaseTypeSelector; 