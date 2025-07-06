import React from 'react';
import { Download, Upload, Database } from 'lucide-react';
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
  return (
    <div className="operation-selector">
      <label className="field-label">Operation Type</label>
      <div className="radio-group">
        <label className={`radio-option ${value === 'dump' ? 'selected' : ''}`}>
          <input
            type="radio"
            value="dump"
            checked={value === 'dump'}
            onChange={(e) => onChange(e.target.value)}
            {...register('operation', { required: 'Please select an operation' })}
          />
          <div className="option-content">
            <Download className="option-icon" />
            <div className="option-text">
              <span className="option-title">Dump</span>
              <span className="option-description">Export database to file</span>
            </div>
          </div>
        </label>
        <label className={`radio-option ${value === 'restore' ? 'selected' : ''}`}>
          <input
            type="radio"
            value="restore"
            checked={value === 'restore'}
            onChange={(e) => onChange(e.target.value)}
            {...register('operation', { required: 'Please select an operation' })}
          />
          <div className="option-content">
            <Upload className="option-icon" />
            <div className="option-text">
              <span className="option-title">Restore</span>
              <span className="option-description">Import database from file</span>
            </div>
          </div>
        </label>
      </div>
      {errors.operation && (
        <div className="field-error">
          <span>⚠️</span>
          {errors.operation.message}
        </div>
      )}
    </div>
  );
};

export default OperationSelector; 