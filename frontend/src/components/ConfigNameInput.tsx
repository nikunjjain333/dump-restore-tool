import React from 'react';
import { Save, Tag } from 'lucide-react';
import './ConfigNameInput.scss';

interface ConfigNameInputProps {
  register: any;
  errors: any;
}

const ConfigNameInput: React.FC<ConfigNameInputProps> = ({ register, errors }) => {
  return (
    <div className="config-name-input">
      <label htmlFor="configName" className="field-label">Configuration Name</label>
      <div className="input-wrapper">
        <Tag className="input-icon" />
        <input
          type="text"
          id="configName"
          placeholder="Enter a name for this configuration..."
          {...register('configName', { 
            required: 'Configuration name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' }
          })}
          className={`input ${errors.configName ? 'error' : ''}`}
        />
      </div>
      {errors.configName && (
        <div className="field-error">
          <span>⚠️</span>
          {errors.configName.message}
        </div>
      )}
    </div>
  );
};

export default ConfigNameInput; 