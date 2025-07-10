import React, { useCallback } from 'react';
import { DockerComposeConfig } from '../api/client';
import { Play, StopCircle, RefreshCw, List, FileText, Hammer, Trash2, Layers, Edit } from 'lucide-react';
import './ConfigCard.scss';

interface ConfigCardProps {
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
  onEdit: (config: DockerComposeConfig) => void;
  getContainerStatusIcon: (state: string | undefined) => string;
  getContainerError: (configId: number, containerName: string) => string | undefined;
  hasAnyRunningContainer: (configId: number) => boolean;
}

const ConfigCard: React.FC<ConfigCardProps> = React.memo(({
  config,
  isOperating,
  operatingOperation,
  containerStatuses,
  refreshingStatuses,
  containerErrors,
  onOperation,
  onDelete,
  onEdit,
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

  const handleEdit = useCallback(() => {
    onEdit(config);
  }, [config, onEdit]);

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
            onClick={handleEdit}
            className="btn btn-icon btn-secondary"
            title="Edit configuration"
            disabled={isOperating}
          >
            <Edit className="compose-icon-gradient" />
          </button>
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

export default ConfigCard; 