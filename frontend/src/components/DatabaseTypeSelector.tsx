import React from 'react';
import { Database, Server, HardDrive, Settings } from 'lucide-react';
import './DatabaseTypeSelector.scss';

interface DatabaseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  register: any;
  errors: any;
}

const DatabaseTypeSelector: React.FC<DatabaseTypeSelectorProps> = ({ 
  value, 
  onChange, 
  register, 
  errors 
}) => {
  const databaseTypes = [
    { value: 'postgres', label: 'PostgreSQL', icon: Database },
    { value: 'mysql', label: 'MySQL', icon: Database },
    { value: 'mongodb', label: 'MongoDB', icon: Server },
    { value: 'redis', label: 'Redis', icon: Settings },
    { value: 'sqlite', label: 'SQLite', icon: HardDrive }
  ];

  return (
    <div className="database-type-selector">
      <label className="selector-label">Select Database Type</label>
      <div className="options-grid">
        {databaseTypes.map(({ value: dbValue, label, icon: Icon }) => (
          <label 
            key={dbValue} 
            className={`option-card ${value === dbValue ? 'selected' : ''}`}
          >
            <input
              type="radio"
              value={dbValue}
              {...register('dbType', { required: 'Please select a database type' })}
              onChange={(e) => onChange(e.target.value)}
              className="option-input"
            />
            <div className="option-content">
              <div className="option-icon">
                <Icon />
              </div>
              <span className="option-label">{label}</span>
            </div>
          </label>
        ))}
      </div>
      {errors.dbType && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {errors.dbType.message}
        </div>
      )}
    </div>
  );
};

export default DatabaseTypeSelector; 