import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const hasInitialized = useRef(false);
  const currentRequestId = useRef(0);

  // Initialize with unknown status (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setDockerStatus({
        isRunning: false,
        status: 'unknown'
      });
    }
  }, []);

  const checkDockerStatus = async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingStatus) {
      return;
    }
    
    const requestId = ++currentRequestId.current;
    setIsCheckingStatus(true);
    try {
      const response = await api.getDockerStatus();
      
      // Check if this is still the current request
      if (requestId !== currentRequestId.current) {
        return;
      }
      
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
      // Only reset if this is still the current request
      if (requestId === currentRequestId.current) {
        setIsCheckingStatus(false);
      }
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
        // Update status based on the response
        setDockerStatus(prev => ({
          ...prev,
          isRunning: status === 'running',
          status: status
        }));
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
        // Update status based on the response
        setDockerStatus(prev => ({
          ...prev,
          isRunning: false,
          status: status
        }));
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

  const statusColor = useMemo(() => {
    switch (dockerStatus.status) {
      case 'running':
        return '#10b981'; // green
      case 'stopped':
        return '#ef4444'; // red
      case 'not_accessible':
        return '#f59e0b'; // amber
      case 'unknown':
        return '#6b7280'; // gray
      default:
        return '#6b7280'; // gray
    }
  }, [dockerStatus.status]);

  const statusText = useMemo(() => {
    switch (dockerStatus.status) {
      case 'running':
        return 'Running';
      case 'stopped':
        return 'Stopped';
      case 'not_accessible':
        return 'Not Accessible';
      case 'not_installed':
        return 'Not Installed';
      case 'unknown':
        return 'Click to Check';
      default:
        return 'Unknown';
    }
  }, [dockerStatus.status]);

  return (
    <div className="docker-control">
      <div className="docker-status">
        <div className="status-indicator">
          <div 
            className="status-dot" 
            style={{ backgroundColor: statusColor }}
          />
          <span className="status-text">{statusText}</span>
          {dockerStatus.status === 'unknown' && (
            <span className="status-hint">(Click button below to check)</span>
          )}
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
          ) : dockerStatus.status === 'unknown' ? (
            '🔍 Check Docker Status'
          ) : (
            '🔄 Refresh Status'
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