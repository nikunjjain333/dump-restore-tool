import React from 'react';
import './ConfigNameInput.scss';

interface ConfigNameInputProps {
  register: any;
  errors: any;
}

const ConfigNameInput: React.FC<ConfigNameInputProps> = ({ register, errors }) => {
  return (
    <div className="config-name-input">
      <label htmlFor="configName">Configuration Name</label>
      <input
        type="text"
        id="configName"
        placeholder="Enter a name for this configuration..."
        {...register('configName', { 
          required: 'Configuration name is required',
          minLength: { value: 3, message: 'Name must be at least 3 characters' }
        })}
        className={errors.configName ? 'error' : ''}
      />
      {errors.configName && (
        <span className="error-message">{errors.configName.message}</span>
      )}
    </div>
  );
};

export default ConfigNameInput; 