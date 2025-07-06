import React from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import './PathInput.scss';

interface PathInputProps {
  label: string;
  name: string;
  register: any;
  errors: any;
}

const PathInput: React.FC<PathInputProps> = ({ label, name, register, errors }) => {
  const getIcon = () => {
    if (label.toLowerCase().includes('path')) {
      return <FolderOpen className="input-icon" />;
    }
    return <FileText className="input-icon" />;
  };

  return (
    <div className="path-input">
      <label htmlFor={name} className="field-label">{label}</label>
      <div className="input-wrapper">
        {getIcon()}
        <input
          type="text"
          id={name}
          placeholder={`Enter ${label.toLowerCase()}...`}
          {...register(name, { 
            required: `${label} is required`
          })}
          className={`input ${errors[name] ? 'error' : ''}`}
        />
      </div>
      {errors[name] && (
        <div className="field-error">
          <span>⚠️</span>
          {errors[name].message}
        </div>
      )}
    </div>
  );
};

export default PathInput; 