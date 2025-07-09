import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, DockerComposeConfig, DockerComposeOperationRequest } from '../api/client';
import Modal from './Modal';
import './DockerComposeConfigList.scss';
import { Play, StopCircle, RefreshCw, List, FileText, Hammer, Trash2, Layers } from 'lucide-react';

interface DockerComposeConfigListProps {
  onRefresh?: () => void;
  refreshKey?: number;
}

// Separate component for individual config card
const ConfigCard: React.FC<{
  config: DockerComposeConfig;
  isOperating: boolean;
  operatingOperation?: string;
  containerStatuses: Array<{
    service_name: string;
    container_name: string;
    status: string;
  }>;
  refreshingStatuses: Set<number>;
  containerErrors: Map<number, Map<string, string>>;
  onOperation: (configId: number, operation: string) => void;
  onDelete: (configId: number) => void;
  getContainerStatusIcon: (state: string | undefined) => string;
  getContainerError: (configId: number, containerName: string) => string | undefined;
  hasAnyRunningContainer: (configId: number) => boolean;
}> = React.memo(({
  config,
  isOperating,
  operatingOperation,
  containerStatuses,
  refreshingStatuses,
  containerErrors,
  onOperation,
  onDelete,
  getContainerStatusIcon,
  getContainerError,
  hasAnyRunningContainer
}) => {
  const handleOperation = useCallback((operation: string) => {
    onOperation(config.id, operation);
  }, [config.id, onOperation]);

  const handleDelete = useCallback(() => {
    onDelete(config.id);
  }, [config.id, onDelete]);

  const isRefreshing = refreshingStatuses.has(config.id);

  return (
    <div className="config-card">
      <div className="config-header">
        <div className="config-title-section">
          <span className="compose-icon-gradient"><Layers size={24} /></span>
          <h4>{config.name}</h4>
        </div>
        <div className="config-actions">
          <button
            onClick={handleDelete}
            className="btn btn-icon btn-danger"
            title="Delete configuration"
            disabled={isOperating}
          >
            <Trash2 className="compose-icon-gradient" />
          </button>
        </div>
      </div>

      <div className="config-details">
        <div className="detail-item">
          <div className="label-section">
            <span className="label">Containers:</span>
          </div>
        </div>
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
              {containerStatuses.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: '#888', fontStyle: 'italic' }}>No containers found</td>
                </tr>
              ) : (
                containerStatuses.map((service, idx) => {
                  const containerError = getContainerError(config.id, service.container_name);
                  const hasError = !!containerError;
                  
                  let statusIcon, statusText;
                  if (hasError) {
                    statusIcon = '❌';
                    statusText = 'Error';
                  } else {
                    statusIcon = getContainerStatusIcon(service.status);
                    statusText = service.status || 'Unknown';
                  }
                  
                  return (
                    <tr key={idx}>
                      <td>{service.service_name || '-'}</td>
                      <td>{service.container_name || '-'}</td>
                      <td>
                        <span
                          className={hasError ? 'status-with-tooltip error-status' : ''}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
                        >
                          {statusIcon}
                          <span style={{ fontSize: '0.85em', color: hasError ? '#ef4444' : 'var(--text-secondary)' }}>
                            {statusText}
                            {isRefreshing && (
                              <span style={{ marginLeft: '4px', fontSize: '0.8em', color: 'var(--text-accent)' }}>
                                (refreshing...)
                              </span>
                            )}
                          </span>
                          {hasError && (
                            <span className="status-tooltip">
                              {containerError}
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
            onClick={() => handleOperation('up')}
            className="btn btn-gradient"
            disabled={isOperating}
          >
            {operatingOperation === 'up' ? (
              <><Play className="compose-icon-gradient" size={18} /> Launching...</>
            ) : (
              <><Play className="compose-icon-gradient" size={18} /> Launch Stack</>
            )}
          </button>
          
          <button
            onClick={() => handleOperation('down')}
            className="btn btn-gradient"
            disabled={isOperating}
          >
            {operatingOperation === 'down' ? (
              <><StopCircle className="compose-icon-gradient" size={18} /> Stopping...</>
            ) : (
              <><StopCircle className="compose-icon-gradient" size={18} /> Stop Stack</>
            )}
          </button>
          
          <button
            onClick={() => handleOperation('restart')}
            className="btn btn-gradient"
            disabled={isOperating || !hasAnyRunningContainer(config.id)}
          >
            {operatingOperation === 'restart' ? (
              <><RefreshCw className="compose-icon-gradient" size={18} /> Restarting...</>
            ) : (
              <><RefreshCw className="compose-icon-gradient" size={18} /> Restart Stack</>
            )}
          </button>
        </div>

        <div className="secondary-operations">
          <button
            onClick={() => handleOperation('ps')}
            className="btn btn-secondary btn-small"
            disabled={isOperating}
          >
            {operatingOperation === 'ps' ? (
              <><List className="compose-icon-gradient" size={16} /> Checking...</>
            ) : (
              <><List className="compose-icon-gradient" size={16} /> Show Status</>
            )}
          </button>
          
          <button
            onClick={() => handleOperation('logs')}
            className="btn btn-secondary btn-small"
            disabled={isOperating}
          >
            {operatingOperation === 'logs' ? (
              <><FileText className="compose-icon-gradient" size={16} /> Loading...</>
            ) : (
              <><FileText className="compose-icon-gradient" size={16} /> View Logs</>
            )}
          </button>
          
          <button
            onClick={() => handleOperation('build')}
            className="btn btn-secondary btn-small"
            disabled={isOperating || !hasAnyRunningContainer(config.id)}
          >
            {operatingOperation === 'build' ? (
              <><Hammer className="compose-icon-gradient" size={16} /> Building...</>
            ) : (
              <><Hammer className="compose-icon-gradient" size={16} /> Rebuild Images</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ConfigCard.displayName = 'ConfigCard';

const DockerComposeConfigList: React.FC<DockerComposeConfigListProps> = ({ onRefresh, refreshKey }) => {
  const [configs, setConfigs] = useState<DockerComposeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [operatingConfigs, setOperatingConfigs] = useState<Set<number>>(new Set());
  const [operatingOperations, setOperatingOperations] = useState<Map<number, string>>(new Map());
  const [serviceStatuses, setServiceStatuses] = useState<Map<number, { 
    isRunning: boolean; 
    services: Array<{
      service_name: string;
      container_name: string;
      status: string;
    }>;
    hasSpecificService: boolean;
  }>>(new Map());
  const [containerErrors, setContainerErrors] = useState<Map<number, Map<string, string>>>(new Map());
  const [refreshingStatuses, setRefreshingStatuses] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'status';
    contentType?: 'text' | 'logs' | 'preformatted';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      fetchConfigs().finally(() => setIsFetching(false));
    }
  }, [refreshKey]);

  const fetchConfigs = useCallback(async () => {
    if (isFetching) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.getDockerComposeConfigs();
      setConfigs(response.data);
      await fetchServiceStatuses(response.data);
    } catch (err) {
      setError('Failed to fetch Docker Compose configurations');
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  }, [isFetching]);

  const fetchServiceStatuses = useCallback(async (configsToCheck: DockerComposeConfig[], showRefreshing: boolean = false) => {
    console.log(`Fetching service statuses for ${configsToCheck.length} configs, showRefreshing: ${showRefreshing}`);
    
    const statusMap = new Map<number, { 
      isRunning: boolean; 
      services: Array<{
        service_name: string;
        container_name: string;
        status: string;
      }>;
      hasSpecificService: boolean;
    }>();
    
    if (showRefreshing) {
      setRefreshingStatuses(prev => {
        const newSet = new Set(prev);
        configsToCheck.forEach(config => newSet.add(config.id));
        return newSet;
      });
    }
    
    for (const config of configsToCheck) {
      try {
        const response = await api.getDockerComposeServices(config.id);
        if (response.data.success && response.data.services) {
          const runningServices = response.data.services.filter((service: any) => {
            const state = (service.status || service.State || '').toLowerCase();
            return state.includes('running') || state.includes('up') || state === 'started';
          });
          
          const validServices = response.data.services.map((service: any) => ({
            service_name: service.service_name || service.Service || service.Name || 'Unknown',
            container_name: service.container_name || service.Name || 'Unknown',
            status: service.status || service.State || 'Unknown',
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
    
    if (showRefreshing) {
      setRefreshingStatuses(prev => {
        const newSet = new Set(prev);
        configsToCheck.forEach(config => newSet.delete(config.id));
        return newSet;
      });
    }
  }, []);

  const handleOperation = useCallback(async (configId: number, operation: string) => {
    try {
      setOperatingConfigs(prev => new Set(prev).add(configId));
      setOperatingOperations(prev => new Map(prev).set(configId, operation));
      
      const operationRequest: DockerComposeOperationRequest = {
        config_id: configId,
        operation: operation
      };

      const response = await api.operateDockerCompose(configId, operationRequest);
      
      if (response.data.success) {
        if (operation === 'logs') {
          setModal({
            isOpen: true,
            title: `Docker Compose Logs - ${configs.find(c => c.id === configId)?.name || 'Configuration'}`,
            message: response.data.output || 'No logs available',
            type: 'info',
            contentType: 'logs'
          });
        } else if (operation === 'ps') {
          setModal({
            isOpen: true,
            title: 'Container Status',
            message: response.data.output || 'No status available',
            type: 'status',
            contentType: 'preformatted'
          });
        } else {
          setContainerErrors(prev => {
            const newMap = new Map(prev);
            newMap.delete(configId);
            return newMap;
          });
          
          setModal({
            isOpen: true,
            title: 'Success',
            message: `Docker Compose ${operation} completed successfully!${response.data.output ? '\n\nOutput:\n' + response.data.output : ''}`,
            type: 'success'
          });
          
          setTimeout(async () => {
            await fetchServiceStatuses(configs);
          }, 1000);
          
          if (operation === 'up') {
            setTimeout(async () => {
              console.log(`Refreshing status for config ${configId} after 5 seconds...`);
              const configToRefresh = configs.find(c => c.id === configId);
              if (configToRefresh) {
                await fetchServiceStatuses([configToRefresh], true);
              }
            }, 5000);
          }
        }
      } else {
        setModal({
          isOpen: true,
          title: 'Error',
          message: `Docker Compose ${operation} failed: ${response.data.message || 'Unknown error'}`,
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error(`Error performing ${operation} operation:`, err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: `Docker Compose ${operation} failed: ${err.message || 'Unknown error'}`,
        type: 'error'
      });
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
  }, [configs, fetchServiceStatuses]);

  const handleDelete = useCallback(async (configId: number) => {
    setModal({
      isOpen: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this Docker Compose configuration? This action cannot be undone.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await api.deleteDockerComposeConfig(configId);
          setConfigs(prev => prev.filter(config => config.id !== configId));
          setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
          });
        } catch (err) {
          console.error('Error deleting config:', err);
          setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
          });
        }
      }
    });
  }, []);

  const isOperating = useCallback((configId: number) => operatingConfigs.has(configId), [operatingConfigs]);
  const getOperatingOperation = useCallback((configId: number) => operatingOperations.get(configId), [operatingOperations]);
  const isServiceRunning = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.isRunning || false;
  }, [serviceStatuses]);
  const getContainerStatuses = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.services || [];
  }, [serviceStatuses]);
  const hasSpecificService = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.hasSpecificService || false;
  }, [serviceStatuses]);

  const getContainerStatusIcon = useCallback((state: string | undefined) => {
    if (!state) return '❓';
    const lowerState = state.toLowerCase();
    if (lowerState.includes('running') || lowerState.includes('up') || lowerState === 'started') {
      return '🟢';
    } else if (lowerState.includes('stopped') || lowerState.includes('down') || lowerState === 'exited') {
      return '🔴';
    } else if (lowerState.includes('paused') || lowerState.includes('pause')) {
      return '🟡';
    } else if (lowerState.includes('restarting') || lowerState.includes('starting')) {
      return '🔄';
    } else if (lowerState.includes('created') || lowerState.includes('new')) {
      return '⚪';
    } else {
      return '❓';
    }
  }, []);

  const getContainerName = useCallback((service: any) => {
    return service.container_name || service.Name || service.Service || 'Unknown';
  }, []);

  const getContainerStatus = useCallback((service: any) => {
    return service.status || service.State || 'Unknown';
  }, []);

  const getOverallStatusIcon = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    if (!status) return '❓';
    if (status.isRunning) return '🟢';
    if (status.services.length === 0) return '⚪';
    return '🔴';
  }, [serviceStatuses]);

  const getOverallStatusClass = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    if (!status) return 'status-unknown';
    if (status.isRunning) return 'status-running';
    if (status.services.length === 0) return 'status-stopped';
    return 'status-error';
  }, [serviceStatuses]);

  const getOverallStatusTitle = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    if (!status) return 'Status unknown';
    if (status.isRunning) return 'Services running';
    if (status.services.length === 0) return 'No services found';
    return 'Services stopped';
  }, [serviceStatuses]);

  const hasAnyRunningContainer = useCallback((configId: number) => {
    const status = serviceStatuses.get(configId);
    return status?.isRunning || false;
  }, [serviceStatuses]);

  const parseContainerErrors = useCallback((output: string): Map<string, string> => {
    const errorMap = new Map<string, string>();
    if (!output) return errorMap;
    
    const lines = output.split('\n');
    let currentContainer = '';
    let currentError = '';
    
    for (const line of lines) {
      if (line.includes('Error response from daemon') || line.includes('ERROR:')) {
        if (currentContainer && currentError) {
          errorMap.set(currentContainer, currentError.trim());
        }
        currentError = line;
      } else if (line.includes('container') && line.includes('not found')) {
        const match = line.match(/container\s+([^\s]+)/);
        if (match) {
          currentContainer = match[1];
          currentError = line;
        }
      } else if (currentError && line.trim()) {
        currentError += '\n' + line;
      }
    }
    
    if (currentContainer && currentError) {
      errorMap.set(currentContainer, currentError.trim());
    }
    
    return errorMap;
  }, []);

  const getContainerError = useCallback((configId: number, containerName: string): string | undefined => {
    const configErrors = containerErrors.get(configId);
    return configErrors?.get(containerName);
  }, [containerErrors]);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  if (loading) {
    return (
      <div className="docker-compose-config-list">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Docker Compose configurations...</p>
        </div>
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
        onClose={closeModal}
        title={modal.type === 'status' ? 'Container Status' : modal.title}
        message={modal.message}
        type={modal.type}
        contentType={modal.contentType}
        onConfirm={modal.onConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        autoClose={false}
      />
      <div className="configs-grid">
        {configs.map((config) => (
          <ConfigCard
            key={config.id}
            config={config}
            isOperating={isOperating(config.id)}
            operatingOperation={getOperatingOperation(config.id)}
            containerStatuses={getContainerStatuses(config.id)}
            refreshingStatuses={refreshingStatuses}
            containerErrors={containerErrors}
            onOperation={handleOperation}
            onDelete={handleDelete}
            getContainerStatusIcon={getContainerStatusIcon}
            getContainerError={getContainerError}
            hasAnyRunningContainer={hasAnyRunningContainer}
          />
        ))}
      </div>
    </div>
  );
};

export default DockerComposeConfigList; 