import React, { FC } from 'react';
import { Play, Loader2, Download, Upload } from 'lucide-react';
import './StartProcessButton.scss';

interface StartProcessButtonProps {
  isLoading: boolean;
  operation: string;
  label?: string;
  icon?: React.ReactNode;
}

const StartProcessButton: FC<StartProcessButtonProps> = ({ isLoading, operation, label, icon }: StartProcessButtonProps) => {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="spinner" />
          {label ? `Adding...` : `Starting ${operation || 'process'}...`}
        </>
      );
    }
    
    if (label) {
      return (
        <>
          {icon ? icon : <Play />}
          {label}
        </>
      );
    }
    if (!operation) {
      return (
        <>
          <Play />
          Start Process
        </>
      );
    }
    
    const isDump = operation === 'dump';
    return (
      <>
        {isDump ? <Download /> : <Upload />}
        Start {operation.charAt(0).toUpperCase() + operation.slice(1)}
      </>
    );
  };

  return (
    <div className="start-process-button">
      <button
        type="submit"
        disabled={isLoading || (!operation && !label)}
        className={`btn btn-primary btn-lg ${isLoading ? 'loading' : ''}`}
      >
        {getButtonContent()}
      </button>
      
      {!operation && !label && (
        <div className="button-hint">
          Please select a database type and operation to continue
        </div>
      )}
    </div>
  );
};

export default StartProcessButton; 