import React from "react";
import {
  Database,
  Download,
  Upload,
  Settings,
  Loader2,
  FolderOpen,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Config } from "../api/client";
import "./SavedConfigsList.scss";
import { useOperationStatus } from "../contexts/OperationStatusContext";

interface SavedConfigsListProps {
  configs: Config[];
  onSelect: (config: Config) => void;
  onStartOperation?: (
    config: Config,
    operationType: "dump" | "restore"
  ) => void;
}

const SavedConfigsList: React.FC<SavedConfigsListProps> = ({
  configs,
  onSelect,
  onStartOperation,
}) => {
  const { operationStatus } = useOperationStatus();
  const getDatabaseIcon = (dbType: string) => {
    switch (dbType) {
      case "postgres":
      case "mysql":
      case "mongodb":
        return <Database className="config-icon" />;
      case "redis":
        return <Settings className="config-icon" />;
      case "sqlite":
        return <Database className="config-icon" />;
      default:
        return <Database className="config-icon" />;
    }
  };

  const getStatusIcon = (configId: number) => {
    const status = operationStatus[configId];
    switch (status) {
      case "running":
        return <Loader2 className="status-icon running" />;
      case "success":
        return <CheckCircle className="status-icon success" />;
      case "error":
        return <AlertCircle className="status-icon error" />;
      default:
        return null;
    }
  };

  const getStatusText = (configId: number) => {
    const status = operationStatus[configId];
    switch (status) {
      case "running":
        return "Running...";
      case "success":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "";
    }
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
        {configs.map((config) => {
          const status = operationStatus[config.id];
          const isRunning = status === "running";

          return (
            <div
              key={config.id}
              className={`config-card ${status ? `status-${status}` : ""}`}
            >
              <div className="card-header">
                <div className="config-icon-wrapper">
                  {getDatabaseIcon(config.db_type)}
                </div>
                <div className="config-info">
                  <h4>{config.name}</h4>
                  <div className="config-meta">
                    <span className="db-type">
                      {config.db_type.toUpperCase()}
                    </span>
                  </div>
                </div>
                {status && (
                  <div className="status-indicator">
                    {getStatusIcon(config.id)}
                    <span className="status-text">
                      {getStatusText(config.id)}
                    </span>
                  </div>
                )}
              </div>

              <div className="card-content">
                <div className="config-params">
                  {Object.entries(config.params)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className="param-item">
                        <span className="param-label">{key}:</span>
                        <span className="param-value">{String(value)}</span>
                      </div>
                    ))}
                  {Object.keys(config.params).length > 3 && (
                    <div className="param-item">
                      <span className="param-label">
                        +{Object.keys(config.params).length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(config);
                  }}
                  disabled={isRunning}
                >
                  <Settings />
                  Load Configuration
                </button>
                {onStartOperation && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartOperation(config, "dump");
                      }}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="spinner" />
                          Running...
                        </>
                      ) : (
                        <>
                          <ArrowDown className="icon" />
                          Dump
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartOperation(config, "restore");
                      }}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="spinner" />
                          Running...
                        </>
                      ) : (
                        <>
                          <ArrowUp className="icon" />
                          Restore
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedConfigsList;
