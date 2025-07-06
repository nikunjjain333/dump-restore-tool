import React from 'react';
import { Download, Upload } from 'lucide-react';
import './OperationSelector.scss';

interface OperationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  register: any;
  errors: any;
}

const OperationSelector: React.FC<OperationSelectorProps> = ({
  value,
  onChange,
  register,
  errors
}) => {
  const operations = [
    { value: 'dump', label: 'Dump', icon: Download, description: 'Export database to file' },
    { value: 'restore', label: 'Restore', icon: Upload, description: 'Import database from file' }
  ];

  return (
    <div className="operation-selector">
      <label className="selector-label">Select Operation</label>
      <div className="operations-grid">
        {operations.map(({ value: opValue, label, icon: Icon, description }) => (
          <label 
            key={opValue} 
            className={`operation-card ${value === opValue ? 'selected' : ''}`}
          >
            <input
              type="radio"
              value={opValue}
              {...register('operation', { required: 'Please select an operation' })}
              onChange={(e) => onChange(e.target.value)}
              className="operation-input"
            />
            <div className="operation-content">
              <div className="operation-icon">
                <Icon />
              </div>
              <div className="operation-info">
                <span className="operation-label">{label}</span>
                <span className="operation-description">{description}</span>
              </div>
            </div>
          </label>
        ))}
      </div>
      {errors.operation && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {errors.operation.message}
        </div>
      )}
    </div>
  );
};

export default OperationSelector; 