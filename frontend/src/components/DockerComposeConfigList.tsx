import React, { useState, useEffect } from 'react';
import { api, DockerComposeConfig, DockerComposeOperationRequest } from '../api/client';
import Modal from './Modal';
import './DockerComposeConfigList.scss';

interface DockerComposeConfigListProps {
  onRefresh?: () => void;
  refreshKey?: number;
}

const DockerComposeConfigList: React.FC<DockerComposeConfigListProps> = ({ onRefresh, refreshKey }) => {
  const [configs, setConfigs] = useState<DockerComposeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [operatingConfigs, setOperatingConfigs] = useState<Set<number>>(new Set());
  const [operatingOperations, setOperatingOperations] = useState<Map<number, string>>(new Map());
  const [serviceStatuses, setServiceStatuses] = useState<Map<number, { isRunning: boolean; services: any[] }>>(new Map());
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    contentType?: 'text' | 'logs' | 'preformatted';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchConfigs();
  }, [refreshKey]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getDockerComposeConfigs();
      setConfigs(response.data);
      
      // Fetch service statuses for all configs
      await fetchServiceStatuses(response.data);
    } catch (err) {
      setError('Failed to fetch Docker Compose configurations');
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceStatuses = async (configsToCheck: DockerComposeConfig[]) => {
    const statusMap = new Map<number, { isRunning: boolean; services: any[] }>();
    
    for (const config of configsToCheck) {
      try {
        const response = await api.getDockerComposeServices(config.id);
        if (response.data.success && response.data.services) {
          // Check for running services - look for various possible state values
          const runningServices = response.data.services.filter((service: any) => {
            const state = service.State?.toLowerCase() || '';
            return state.includes('running') || state.includes('up') || state === 'started';
          });
          
          statusMap.set(config.id, {
            isRunning: runningServices.length > 0,
            services: response.data.services
          });
        } else {
          statusMap.set(config.id, { isRunning: false, services: [] });
        }
      } catch (err) {
        console.error(`Error fetching services for config ${config.id}:`, err);
        statusMap.set(config.id, { isRunning: false, services: [] });
      }
    }
    
    setServiceStatuses(statusMap);
  };

  const handleOperation = async (configId: number, operation: string) => {
    try {
      setOperatingConfigs(prev => new Set(prev).add(configId));
      setOperatingOperations(prev => new Map(prev).set(configId, operation));
      
      const operationRequest: DockerComposeOperationRequest = {
        config_id: configId,
        operation: operation
      };

      const response = await api.operateDockerCompose(configId, operationRequest);
      
      if (response.data.success) {
        // For logs operation, show the logs directly
        if (operation === 'logs') {
          setModal({
            isOpen: true,
            title: `Docker Compose Logs - ${configs.find(c => c.id === configId)?.name || 'Configuration'}`,
            message: response.data.output || 'No logs available',
            type: 'info',
            contentType: 'logs'
          });
        } else {
          // Show success message for other operations
          setModal({
            isOpen: true,
            title: 'Success',
            message: `Docker Compose ${operation} completed successfully!${response.data.output ? '\n\nOutput:\n' + response.data.output : ''}`,
            type: 'success'
          });
          
          // Refresh service status after successful operation with a small delay
          setTimeout(async () => {
            await fetchServiceStatuses(configs);
          }, 1000);
          
          if (onRefresh) onRefresh();
        }
      } else {
        setModal({
          isOpen: true,
          title: 'Operation Failed',
          message: `Docker Compose ${operation} failed: ${response.data.message}${response.data.output ? '\n\nOutput:\n' + response.data.output : ''}`,
          type: 'error'
        });
        
        // Refresh service status even on failure to ensure UI consistency
        setTimeout(async () => {
          await fetchServiceStatuses(configs);
        }, 1000);
      }
    } catch (err) {
      console.error(`Error performing ${operation}:`, err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: `Failed to perform ${operation} operation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error'
      });
      
      // Refresh service status even on error to ensure UI consistency
      setTimeout(async () => {
        await fetchServiceStatuses(configs);
      }, 1000);
    } finally {
      setOperatingConfigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
      setOperatingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(configId);
        return newMap;
      });
    }
  };

  const handleDelete = async (configId: number) => {
    setModal({
      isOpen: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this Docker Compose configuration? This action cannot be undone.',
      type: 'warning',
      onConfirm: async () => {
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
      }
    });
  };

  const isOperating = (configId: number) => operatingConfigs.has(configId);
  
  const getOperatingOperation = (configId: number) => operatingOperations.get(configId);
  
  const isServiceRunning = (configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.isRunning || false;
  };

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
        contentType={modal.contentType}
        onConfirm={modal.onConfirm}
        confirmText="Delete"
        cancelText="Cancel"
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
                <span className="label">Status:</span>
                <span className={`value status-indicator ${
                  isOperating(config.id) 
                    ? 'status-loading' 
                    : isServiceRunning(config.id) 
                      ? 'status-running' 
                      : 'status-stopped'
                }`}>
                  {isOperating(config.id) 
                    ? `🔄 ${getOperatingOperation(config.id) === 'up' ? 'Starting...' : 
                         getOperatingOperation(config.id) === 'down' ? 'Stopping...' : 
                         getOperatingOperation(config.id) === 'restart' ? 'Restarting...' : 
                         'Processing...'}`
                    : isServiceRunning(config.id) 
                      ? '🟢 Running' 
                      : '🔴 Stopped'
                  }
                </span>
              </div>
              
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
                  {getOperatingOperation(config.id) === 'up' ? 'Starting...' : '🚀 Up'}
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'down')}
                  className="btn btn-warning"
                  disabled={isOperating(config.id)}
                >
                  {getOperatingOperation(config.id) === 'down' ? 'Stopping...' : '⏹️ Down'}
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'restart')}
                  className="btn btn-info"
                  disabled={isOperating(config.id)}
                >
                  {getOperatingOperation(config.id) === 'restart' ? 'Restarting...' : '🔄 Restart'}
                </button>
              </div>

              <div className="secondary-operations">
                <button
                  onClick={() => handleOperation(config.id, 'ps')}
                  className="btn btn-secondary btn-small"
                  disabled={isOperating(config.id)}
                >
                  {getOperatingOperation(config.id) === 'ps' ? 'Checking...' : '📊 Status'}
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'logs')}
                  className="btn btn-secondary btn-small"
                  disabled={isOperating(config.id)}
                >
                  {getOperatingOperation(config.id) === 'logs' ? 'Loading...' : '📋 Logs'}
                </button>
                
                <button
                  onClick={() => handleOperation(config.id, 'build')}
                  className="btn btn-secondary btn-small"
                  disabled={isOperating(config.id) || !isServiceRunning(config.id)}
                  title={!isServiceRunning(config.id) ? 'Services must be running to build' : ''}
                >
                  {getOperatingOperation(config.id) === 'build' ? 'Building...' : '🔨 Build'}
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