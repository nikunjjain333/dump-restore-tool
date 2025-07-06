import React, { useState, useEffect } from 'react';
import { api, DockerComposeConfig, DockerComposeOperationRequest } from '../api/client';
import Modal from './Modal';
import './DockerComposeConfigList.scss';

interface DockerComposeConfigListProps {
  onRefresh?: () => void;
}

const DockerComposeConfigList: React.FC<DockerComposeConfigListProps> = ({ onRefresh }) => {
  const [configs, setConfigs] = useState<DockerComposeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [operatingConfigs, setOperatingConfigs] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getDockerComposeConfigs();
      setConfigs(response.data);
    } catch (err) {
      setError('Failed to fetch Docker Compose configurations');
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOperation = async (configId: number, operation: string) => {
    try {
      setOperatingConfigs(prev => new Set(prev).add(configId));
      
      const operationRequest: DockerComposeOperationRequest = {
        config_id: configId,
        operation: operation
      };

      const response = await api.operateDockerCompose(configId, operationRequest);
      
      if (response.data.success) {
        // Show success message
        setModal({
          isOpen: true,
          title: 'Success',
          message: `Docker Compose ${operation} completed successfully!${response.data.output ? '\n\nOutput:\n' + response.data.output : ''}`,
          type: 'success'
        });
        if (onRefresh) onRefresh();
      } else {
        setModal({
          isOpen: true,
          title: 'Operation Failed',
          message: `Docker Compose ${operation} failed: ${response.data.message}${response.data.output ? '\n\nOutput:\n' + response.data.output : ''}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error(`Error performing ${operation}:`, err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: `Failed to perform ${operation} operation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setOperatingConfigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    }
  };

  const handleDelete = async (configId: number) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await api.deleteDockerComposeConfig(configId);
      setConfigs(configs.filter(config => config.id !== configId));
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Configuration deleted successfully!',
        type: 'success'
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting config:', err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete configuration',
        type: 'error'
      });
    }
  };

  const isOperating = (configId: number) => operatingConfigs.has(configId);

  if (loading) {
    return (
      <div className="docker-compose-config-list">
        <div className="loading">Loading Docker Compose configurations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="docker-compose-config-list">
        <div className="error-message">{error}</div>
        <button onClick={fetchConfigs} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="docker-compose-config-list">
        <div className="empty-state">
          <h3>No Docker Compose Configurations</h3>
          <p>Add your first Docker Compose configuration to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="docker-compose-config-list">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        autoClose={modal.type === 'success'}
        autoCloseDelay={5000}
      />
      <div className="configs-grid">
        {configs.map((config) => (
          <div key={config.id} className="config-card">
            <div className="config-header">
              <h4>{config.name}</h4>
              <div className="config-actions">
                <button
                  onClick={() => handleDelete(config.id)}
                  className="btn btn-icon btn-danger"
                  title="Delete configuration"
                  disabled={isOperating(config.id)}
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="config-details">
              <div className="detail-item">
                <span className="label">Path:</span>
                <span className="value">{config.path}</span>
              </div>
              
              {config.service_name && (
                <div className="detail-item">
                  <span className="label">Service:</span>
                  <span className="value">{config.service_name}</span>
                </div>
              )}
              
              {config.description && (
                <div className="detail-item">
                  <span className="label">Description:</span>
                  <span className="value">{config.description}</span>
                </div>
              )}

              {config.flags && Object.keys(config.flags).length > 0 && (
                <div className="detail-item">
                  <span className="label">Flags:</span>
                  <span className="value">
                    {Object.entries(config.flags)
                      .filter(([_, value]) => value)
                      .map(([key, _]) => key)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="config-operations">
              <div className="operation-buttons">
                <button
                  onClick={() => handleOperation(config.id, 'up')}
                  className="btn btn-success"
                  disabled={isOperating(config.id)}
                >
                  {isOperating(config.id) ? 'Starting...' : '🚀 Up'}
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'down')}
                  className="btn btn-warning"
                  disabled={isOperating(config.id)}
                >
                  {isOperating(config.id) ? 'Stopping...' : '⏹️ Down'}
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'restart')}
                  className="btn btn-info"
                  disabled={isOperating(config.id)}
                >
                  {isOperating(config.id) ? 'Restarting...' : '🔄 Restart'}
                </button>
              </div>

              <div className="secondary-operations">
                <button
                  onClick={() => handleOperation(config.id, 'ps')}
                  className="btn btn-secondary btn-small"
                  disabled={isOperating(config.id)}
                >
                  📊 Status
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'logs')}
                  className="btn btn-secondary btn-small"
                  disabled={isOperating(config.id)}
                >
                  📋 Logs
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'build')}
                  className="btn btn-secondary btn-small"
                  disabled={isOperating(config.id)}
                >
                  🔨 Build
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DockerComposeConfigList; 