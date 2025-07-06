import React from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Settings, 
  Loader2,
  FolderOpen,
  Clock
} from 'lucide-react';
import { Config } from '../api/client';
import './SavedConfigsList.scss';

interface SavedConfigsListProps {
  configs: Config[];
  onSelect: (config: Config) => void;
}

const SavedConfigsList: React.FC<SavedConfigsListProps> = ({ configs, onSelect }) => {
  const getDatabaseIcon = (dbType: string) => {
    switch (dbType) {
      case 'postgres':
      case 'mysql':
      case 'mongodb':
        return <Database className="config-icon" />;
      case 'redis':
        return <Settings className="config-icon" />;
      case 'sqlite':
        return <Database className="config-icon" />;
      default:
        return <Database className="config-icon" />;
    }
  };

  const getOperationIcon = (operation: string) => {
    return operation === 'dump' ? <Download className="operation-icon" /> : <Upload className="operation-icon" />;
  };

  if (configs.length === 0) {
    return (
      <div className="saved-configs-list">
        <div className="empty-state">
          <FolderOpen className="empty-icon" />
          <h3>No Saved Configurations</h3>
          <p>Create and save your first configuration to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-configs-list">
      <div className="configs-header">
        <h3>Saved Configurations ({configs.length})</h3>
        <p>Click on a configuration to load it</p>
      </div>
      <div className="configs-grid">
        {configs.map((config) => (
          <div key={config.id} className="config-card" onClick={() => onSelect(config)}>
            <div className="card-header">
              <div className="config-icon-wrapper">
                {getDatabaseIcon(config.db_type)}
              </div>
              <div className="config-info">
                <h4>{config.name}</h4>
                <div className="config-meta">
                  <span className="db-type">{config.db_type.toUpperCase()}</span>
                  <div className="operation-badge">
                    {getOperationIcon(config.operation)}
                    <span>{config.operation}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-content">
              <div className="config-params">
                {Object.entries(config.params).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="param-item">
                    <span className="param-label">{key}:</span>
                    <span className="param-value">{String(value)}</span>
                  </div>
                ))}
                {Object.keys(config.params).length > 3 && (
                  <div className="param-item">
                    <span className="param-label">+{Object.keys(config.params).length - 3} more</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card-actions">
              <button type="button" className="btn btn-secondary">
                <Settings />
                Load Configuration
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedConfigsList; 