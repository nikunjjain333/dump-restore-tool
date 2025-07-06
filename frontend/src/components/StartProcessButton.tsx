import React from 'react';
import './StartProcessButton.scss';

interface StartProcessButtonProps {
  isLoading: boolean;
  operation: string;
}

const StartProcessButton: React.FC<StartProcessButtonProps> = ({ isLoading, operation }) => {
  const getButtonText = () => {
    if (isLoading) {
      return `Starting ${operation || 'process'}...`;
    }
    if (!operation) {
      return 'Start Process';
    }
    return `Start ${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
  };

  return (
    <div className="start-process-button">
      <button
        type="submit"
        disabled={isLoading || !operation}
        className="btn btn-success btn-lg"
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export default StartProcessButton; 