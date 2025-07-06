import React from 'react';
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
      <label>Operation Type</label>
      <div className="radio-group">
        <label className="radio-option">
          <input
            type="radio"
            value="dump"
            checked={value === 'dump'}
            onChange={(e) => onChange(e.target.value)}
            {...register('operation', { required: 'Please select an operation' })}
          />
          <span>Dump</span>
        </label>
        <label className="radio-option">
          <input
            type="radio"
            value="restore"
            checked={value === 'restore'}
            onChange={(e) => onChange(e.target.value)}
            {...register('operation', { required: 'Please select an operation' })}
          />
          <span>Restore</span>
        </label>
      </div>
      {errors.operation && <span className="error-message">{errors.operation.message}</span>}
    </div>
  );
};

export default OperationSelector; 