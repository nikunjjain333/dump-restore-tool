import React from 'react';
import { Tag } from 'lucide-react';
import './ConfigNameInput.scss';

interface ConfigNameInputProps {
  register: any;
  errors: any;
}

const ConfigNameInput: React.FC<ConfigNameInputProps> = ({ register, errors }) => {
  return (
    <div className="config-name-input">
      <label className="field-label">
        <Tag className="field-icon" />
        Configuration Name
        <span className="required">*</span>
      </label>
      <div className="input-wrapper">
        <input
          type="text"
          {...register('configName', { 
            required: 'Configuration name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' }
          })}
          className={`field-input ${errors.configName ? 'error' : ''}`}
          placeholder="Enter configuration name..."
        />
      </div>
      {errors.configName && (
        <div className="field-error">
          <span className="error-icon">⚠</span>
          {errors.configName.message?.toString() || 'Configuration name is required'}
        </div>
      )}
    </div>
  );
};

export default ConfigNameInput; 