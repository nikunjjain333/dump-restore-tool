import React from 'react';
import './PathInput.scss';

interface PathInputProps {
  label: string;
  name: string;
  register: any;
  errors: any;
}

const PathInput: React.FC<PathInputProps> = ({ label, name, register, errors }) => {
  return (
    <div className="path-input">
      <label htmlFor={name}>{label}</label>
      <input
        type="text"
        id={name}
        placeholder={`Enter ${label.toLowerCase()}...`}
        {...register(name, { 
          required: `${label} is required`
        })}
        className={errors[name] ? 'error' : ''}
      />
      {errors[name] && (
        <span className="error-message">{errors[name].message}</span>
      )}
    </div>
  );
};

export default PathInput; 