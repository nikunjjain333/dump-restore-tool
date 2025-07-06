import React, { useState } from 'react';
import { api, DockerResponse } from '../api/client';
import './DockerButton.scss';

const DockerButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDocker = async () => {
    setIsLoading(true);
    try {
      const response = await api.startDocker();
      const { success, message } = response.data as DockerResponse;
      
      if (success) {
        alert(`✅ ${message}`);
      } else {
        alert(`⚠️ ${message}`);
      }
    } catch (error) {
      console.error('Failed to start Docker:', error);
      alert('❌ Failed to connect to Docker. Please ensure Docker Desktop is running and the application has proper permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="docker-button">
      <button
        type="button"
        onClick={handleStartDocker}
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Checking Docker...' : 'Check Docker Status'}
      </button>
    </div>
  );
};

export default DockerButton; 