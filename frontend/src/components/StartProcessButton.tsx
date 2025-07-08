import React, { FC } from 'react';
import { Play, Download, Upload, Loader2 } from 'lucide-react';
import './StartProcessButton.scss';

interface StartProcessButtonProps {
  isLoading: boolean;
  label?: string;
  icon?: React.ReactNode;
}

const StartProcessButton: FC<StartProcessButtonProps> = ({ isLoading, label, icon }: StartProcessButtonProps) => {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="spinner" />
          {label ? `Adding...` : `Starting process...`}
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
    
    return (
      <>
        <Play />
        Start Process
      </>
    );
  };

  return (
    <div className="start-process-button">
      <button
        type="submit"
        disabled={isLoading}
        className={`btn btn-primary btn-lg ${isLoading ? 'loading' : ''}`}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

export default StartProcessButton; 