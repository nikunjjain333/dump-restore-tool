import React, { useState, useEffect } from 'react';
import { api, DockerResponse } from '../api/client';
import toast from 'react-hot-toast';
import './DockerButton.scss';

interface DockerStatus {
  isRunning: boolean;
  status: string;
  info?: {
    containers: number;
    images: number;
    version: string;
    os: string;
    architecture: string;
  };
}

const DockerButton: React.FC = () => {
  const [dockerStatus, setDockerStatus] = useState<DockerStatus>({
    isRunning: false,
    status: 'unknown'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Check Docker status on component mount
  useEffect(() => {
    checkDockerStatus();
  }, []);

  const checkDockerStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await api.getDockerStatus();
      const { success, status, info } = response.data;
      
      setDockerStatus({
        isRunning: success && status === 'running',
        status: status,
        info: info
      });

      if (success) {
        toast.success(`Docker is ${status}! 🐳`);
      } else {
        toast.error('Docker is not accessible');
      }
    } catch (error) {
      console.error('Failed to check Docker status:', error);
      setDockerStatus({
        isRunning: false,
        status: 'error'
      });
      toast.error('Failed to check Docker status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleStartDocker = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading('Starting Docker...');
    
    try {
      const response = await api.startDocker();
      const { success, message, status } = response.data;
      
      toast.dismiss(loadingToast);
      
      if (success) {
        toast.success(`✅ ${message}`);
        setDockerStatus({
          isRunning: status === 'running',
          status: status
        });
      } else {
        toast.error(`⚠️ ${message}`);
      }
    } catch (error) {
      console.error('Failed to start Docker:', error);
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to start Docker. Please check if Docker Desktop is installed and running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopDocker = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading('Stopping Docker...');
    
    try {
      const response = await api.stopDocker();
      const { success, message, status } = response.data;
      
      toast.dismiss(loadingToast);
      
      if (success) {
        toast.success(`✅ ${message}`);
        setDockerStatus({
          isRunning: false,
          status: status
        });
      } else {
        toast.error(`⚠️ ${message}`);
      }
    } catch (error) {
      console.error('Failed to stop Docker:', error);
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to stop Docker');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (dockerStatus.status) {
      case 'running':
        return '#10b981'; // green
      case 'stopped':
        return '#ef4444'; // red
      case 'not_accessible':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = () => {
    switch (dockerStatus.status) {
      case 'running':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'not_accessible':
        return 'Not Accessible';
      case 'not_installed':
        return 'Not Installed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="docker-control">
      <div className="docker-status">
        <div className="status-indicator">
          <div 
            className="status-dot" 
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="status-text">{getStatusText()}</span>
        </div>
        
        {dockerStatus.info && (
          <div className="docker-info">
            <div className="info-item">
              <span className="label">Containers:</span>
              <span className="value">{dockerStatus.info.containers}</span>
            </div>
            <div className="info-item">
              <span className="label">Images:</span>
              <span className="value">{dockerStatus.info.images}</span>
            </div>
            <div className="info-item">
              <span className="label">Version:</span>
              <span className="value">{dockerStatus.info.version}</span>
            </div>
          </div>
        )}
      </div>

      <div className="docker-actions">
        <button
          type="button"
          onClick={checkDockerStatus}
          disabled={isCheckingStatus}
          className="btn btn-secondary"
        >
          {isCheckingStatus ? (
            <>
              <span className="spinner"></span>
              Checking...
            </>
          ) : (
            '🔄 Check Status'
          )}
        </button>

        <button
          type="button"
          onClick={handleStartDocker}
          disabled={isLoading || dockerStatus.isRunning}
          className="btn btn-success"
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Starting...
            </>
          ) : (
            '▶️ Start Docker'
          )}
        </button>

        <button
          type="button"
          onClick={handleStopDocker}
          disabled={isLoading || !dockerStatus.isRunning}
          className="btn btn-danger"
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Stopping...
            </>
          ) : (
            '⏹️ Stop Docker'
          )}
        </button>
      </div>
    </div>
  );
};

export default DockerButton; 