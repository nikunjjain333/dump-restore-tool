import React from 'react';
import './DumpFileNameInput.scss';

interface DumpFileNameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

const DumpFileNameInput: React.FC<DumpFileNameInputProps> = ({
  value,
  onChange,
  error,
  placeholder = "Enter filename (without extension)"
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any file extensions and special characters
    let filename = e.target.value;
    filename = filename.replace(/\.(sql|bson|rdb|db|dump)$/i, ''); // Remove extensions
    filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace special chars with underscore
    filename = filename.replace(/_+/g, '_'); // Replace multiple underscores with single
    filename = filename.replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    onChange(filename);
  };

  return (
    <div className="dump-filename-input">
      <label className="input-label" htmlFor="dump-filename-input">
        Dump File Name (Optional)
        <span className="input-hint">Enter a custom filename without extension</span>
      </label>
      <input
        id="dump-filename-input"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`input-field ${error ? 'input-error' : ''}`}
      />
      {error && <div className="error-message">{error}</div>}
      <div className="input-help">
        The backend will automatically add the appropriate extension based on database type.
        If left empty, the configuration name will be used.
      </div>
    </div>
  );
};

export default DumpFileNameInput; 