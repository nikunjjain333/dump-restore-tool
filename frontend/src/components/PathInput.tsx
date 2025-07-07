import React from 'react';
import { FolderOpen } from 'lucide-react';
import './PathInput.scss';

interface PathInputProps {
  label: string;
  name: string;
  register: any;
  errors: any;
  required?: boolean;
}

const PathInput: React.FC<PathInputProps> = ({ label, name, register, errors, required = true }) => {
  return (
    <div className="path-input">
      <label className="field-label">
        <FolderOpen className="field-icon" />
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          type="text"
          {...register(name, { 
            required: required ? `${label} is required` : false,
            pattern: {
              value: /^[\/\w\-\.]+$/,
              message: 'Please enter a valid path'
            }
          })}
          className={`field-input ${errors[name] ? 'error' : ''}`}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
      {errors[name] && (
        <div className="field-error">
          <span className="error-icon">⚠</span>
          {errors[name].message}
        </div>
      )}
    </div>
  );
};

export default PathInput; 