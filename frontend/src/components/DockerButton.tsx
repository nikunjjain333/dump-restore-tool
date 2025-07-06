import React, { useMemo } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Container,
  Image,
  Code,
  Activity
} from 'lucide-react';
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

interface DockerButtonProps {
  dockerStatus: DockerStatus;
  checkDockerStatus: () => Promise<void>;
  isCheckingStatus: boolean;
}

const DockerButton: React.FC<DockerButtonProps> = ({ 
  dockerStatus, 
  checkDockerStatus, 
  isCheckingStatus 
}) => {
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

  const handleCheckStatus = async () => {
    try {
      await checkDockerStatus();
      if (dockerStatus.status === 'running') {
        toast.success(`Docker is ${dockerStatus.status}! 🐳`);
      } else if (dockerStatus.status !== 'unknown') {
        toast.error('Docker is not accessible');
      }
    } catch (error) {
      toast.error('Failed to check Docker status');
    }
  };

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
              <Container className="info-icon" />
              <span className="label">Containers:</span>
              <span className="value">{dockerStatus.info.containers}</span>
            </div>
            <div className="info-item">
              <Image className="info-icon" />
              <span className="label">Images:</span>
              <span className="value">{dockerStatus.info.images}</span>
            </div>
            <div className="info-item">
              <Code className="info-icon" />
              <span className="label">Version:</span>
              <span className="value">{dockerStatus.info.version}</span>
            </div>
          </div>
        )}
      </div>

      <div className="docker-actions">
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={isCheckingStatus}
          className="btn btn--primary"
        >
          {isCheckingStatus ? (
            <>
              <Loader2 className="spinner" />
              Checking...
            </>
          ) : dockerStatus.status === 'unknown' ? (
            <>
              <Activity />
              Check Docker Status
            </>
          ) : (
            <>
              <RefreshCw />
              Refresh Status
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DockerButton; 