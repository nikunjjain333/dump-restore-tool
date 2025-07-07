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
  const [serviceStatuses, setServiceStatuses] = useState<Map<number, { 
    isRunning: boolean; 
    services: Array<{
      Name?: string;
      State?: string;
      Status?: string;
      Ports?: string;
    }>;
    hasSpecificService: boolean;
  }>>(new Map());
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
    const statusMap = new Map<number, { 
      isRunning: boolean; 
      services: Array<{
        Name?: string;
        State?: string;
        Status?: string;
        Ports?: string;
      }>;
      hasSpecificService: boolean;
    }>();
    
    for (const config of configsToCheck) {
      try {
        const response = await api.getDockerComposeServices(config.id);
        if (response.data.success && response.data.services) {
          
          // Check for running services - look for various possible state values
          const runningServices = response.data.services.filter((service: any) => {
            const state = service.State?.toLowerCase() || '';
            return state.includes('running') || state.includes('up') || state === 'started';
          });
          
          // Filter out invalid service objects and ensure they have required properties
          const validServices = response.data.services.filter((service: any) => 
            service && typeof service === 'object'
          ).map((service: any) => ({
            Name: service.Name || 'Unknown',
            State: service.State || 'Unknown',
            Status: service.Status || '',
            Ports: service.Ports || ''
          }));
          
          statusMap.set(config.id, {
            isRunning: runningServices.length > 0,
            services: validServices,
            hasSpecificService: !!config.service_name
          });
        } else {
          statusMap.set(config.id, { 
            isRunning: false, 
            services: [],
            hasSpecificService: !!config.service_name
          });
        }
      } catch (err) {
        console.error(`Error fetching services for config ${config.id}:`, err);
        statusMap.set(config.id, { 
          isRunning: false, 
          services: [],
          hasSpecificService: !!config.service_name
        });
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

  const getContainerStatuses = (configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.services || [];
  };

  const hasSpecificService = (configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.hasSpecificService || false;
  };

  const getContainerStatusIcon = (state: string | undefined) => {
    if (!state) return '🟡';
    
    const stateLower = state.toLowerCase();
    if (stateLower.includes('running') || stateLower.includes('up') || stateLower === 'started') {
      return '🟢';
    } else if (stateLower.includes('exited') || stateLower.includes('stopped') || stateLower.includes('down')) {
      return '🔴';
    } else if (stateLower.includes('starting') || stateLower.includes('stopping') || stateLower.includes('restarting')) {
      return '🔄';
    } else {
      return '🟡';
    }
  };

  const getContainerName = (service: any) => {
    // Try different possible container name fields
    const name = service.Name || service.Container || service.Service;
    return name || 'Container';
  };

  const getContainerStatus = (service: any) => {
    // Try different possible status fields
    const status = service.State || service.Status;
    return status || 'Stopped';
  };

  const getOverallStatusIcon = (configId: number) => {
    const containers = getContainerStatuses(configId);
    if (containers.length === 0) return '🟡';
    
    const runningCount = containers.filter((s: any) => {
      const state = getContainerStatus(s)?.toLowerCase() || '';
      return state.includes('running') || state.includes('up');
    }).length;
    
    if (runningCount === 0) return '🔴'; // All stopped
    if (runningCount === containers.length) return '🟢'; // All running
    return '🟡'; // Mixed state
  };

  const getOverallStatusClass = (configId: number) => {
    const containers = getContainerStatuses(configId);
    if (containers.length === 0) return 'status-unknown';
    
    const runningCount = containers.filter((s: any) => {
      const state = getContainerStatus(s)?.toLowerCase() || '';
      return state.includes('running') || state.includes('up');
    }).length;
    
    if (runningCount === 0) return 'status-stopped';
    if (runningCount === containers.length) return 'status-running';
    return 'status-mixed';
  };

  const getOverallStatusTitle = (configId: number) => {
    const containers = getContainerStatuses(configId);
    if (containers.length === 0) return 'No containers found';
    
    const runningCount = containers.filter((s: any) => {
      const state = getContainerStatus(s)?.toLowerCase() || '';
      return state.includes('running') || state.includes('up');
    }).length;
    
    if (runningCount === 0) return 'All containers stopped';
    if (runningCount === containers.length) return 'All containers running';
    return `${runningCount}/${containers.length} containers running`;
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
              <div className="config-title-section">
                <h4>{config.name}</h4>
              </div>
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
                <div className="label-section">
                  <span className="label">Containers:</span>
                  <button
                    onClick={() => fetchServiceStatuses([config])}
                    className="btn btn-icon btn-refresh"
                    title="Refresh container status"
                    disabled={isOperating(config.id)}
                  >
                    🔄
                  </button>
                </div>
              </div>
              {/* Service Table - moved below the label-section block for correct alignment */}
              <div className="containers-list">
                <table style={{ width: '100%', fontSize: '0.95em', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Service</th>
                      <th style={{ textAlign: 'left' }}>Container</th>
                      <th style={{ textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getContainerStatuses(config.id) as any[]).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ color: '#888', fontStyle: 'italic' }}>No containers found</td>
                      </tr>
                    ) : (
                      getContainerStatuses(config.id).map((service: any, idx: number) => (
                        <tr key={idx}>
                          <td>{service.service_name || service.Service || service.Name || '-'}</td>
                          <td>{service.container_name || service.Name || '-'}</td>
                          <td>{getContainerStatusIcon(service.status || service.State || service.Status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="detail-item path-block">
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
                  disabled={isOperating(config.id)}
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