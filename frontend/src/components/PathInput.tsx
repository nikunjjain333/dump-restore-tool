import React from 'react';
import { FolderOpen } from 'lucide-react';
import './PathInput.scss';

interface PathInputProps {
  label: string;
  name: string;
  register: any;
  errors: any;
  required?: boolean;
  operation?: 'dump' | 'restore';
  dbType?: string;
}

const PathInput: React.FC<PathInputProps> = ({ 
  label, 
  name, 
  register, 
  errors, 
  required = true,
  operation,
  dbType
}) => {
  // Generate appropriate placeholder based on operation and database type
  const getPlaceholder = () => {
    if (operation === 'dump') {
      switch (dbType) {
        case 'postgres':
        case 'mysql':
          return 'e.g., /path/to/dump.sql or /path/to/dumps/database_dump.sql';
        case 'mongodb':
          return 'e.g., /path/to/dumps/ or /path/to/mongodb_dumps/';
        case 'redis':
          return 'e.g., /path/to/dump.rdb or /path/to/dumps/redis_dump.rdb';
        case 'sqlite':
          return 'e.g., /path/to/dump.db or /path/to/dumps/database.db';
        default:
          return 'Enter dump path...';
      }
    } else if (operation === 'restore') {
      switch (dbType) {
        case 'postgres':
        case 'mysql':
          return 'e.g., /path/to/restore.sql';
        case 'mongodb':
          return 'e.g., /path/to/dumps/ or /path/to/mongodb_dumps/';
        case 'redis':
          return 'e.g., /path/to/restore.rdb';
        case 'sqlite':
          return 'e.g., /path/to/restore.db';
        default:
          return 'Enter restore path...';
      }
    }
    return `Enter ${label.toLowerCase()}...`;
  };

  // Generate help text based on operation and database type
  const getHelpText = () => {
    if (operation === 'dump') {
      switch (dbType) {
        case 'postgres':
        case 'mysql':
          return 'For SQL databases, specify a file path ending with .sql extension. You can use any directory on your system - the system will automatically handle file system restrictions.';
        case 'mongodb':
          return 'For MongoDB, specify a directory path where the dump will be created (e.g., /path/to/dumps/). You can use any directory on your system.';
        case 'redis':
          return 'For Redis, specify a file path ending with .rdb extension. You can use any directory on your system - the system will automatically handle file system restrictions.';
        case 'sqlite':
          return 'For SQLite, specify a file path ending with .db extension. You can use any directory on your system.';
        default:
          return '';
      }
    } else if (operation === 'restore') {
      switch (dbType) {
        case 'postgres':
        case 'mysql':
          return 'For SQL databases, specify a file path ending with .sql extension.';
        case 'mongodb':
          return 'For MongoDB, specify a directory path containing the dump (e.g., /path/to/dumps/).';
        case 'redis':
          return 'For Redis, specify a file path ending with .rdb extension.';
        case 'sqlite':
          return 'For SQLite, specify a file path ending with .db extension.';
        default:
          return '';
      }
    }
    return '';
  };

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
            },
            validate: (value: string) => {
              if (!value) return true; // Let required validation handle empty values
              
              // Only validate basic path format, don't restrict to specific directories
              if (value.includes('..') || value.includes('//')) {
                return 'Path contains invalid characters';
              }
              
              return true;
            }
          })}
          className={`field-input ${errors[name] ? 'error' : ''}`}
          placeholder={getPlaceholder()}
        />
      </div>
      {getHelpText() && (
        <div className="field-help">
          <span className="help-icon">💡</span>
          {getHelpText()}
        </div>
      )}
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