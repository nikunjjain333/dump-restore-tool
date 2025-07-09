import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Database, 
  Download, 
  Upload, 
  Settings, 
  Search,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Loader2
} from 'lucide-react';
import './ConfigurationsPage.scss';
import { api, Config, OperationResponse } from '../api/client';
import type { AxiosResponse } from 'axios';
import SavedConfigsList from '../components/SavedConfigsList';
import Modal from '../components/Modal';

const ConfigurationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOperation, setFilterOperation] = useState('all');
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
  const [operationStatus, setOperationStatus] = useState<Record<number, 'idle' | 'running' | 'success' | 'error'>>({});
  const hasLoaded = useRef(false);
  const [downloadLinks, setDownloadLinks] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!hasLoaded.current) {
      loadConfigurations();
      hasLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    filterConfigurations();
  }, [configs, searchTerm, filterType, filterOperation]);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      const response = await api.getConfigs();
      setConfigs(response.data);
    } catch (error) {
      console.error('Failed to load configurations:', error);
      toast.error('Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const filterConfigurations = () => {
    let filtered = configs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(config =>
        config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.db_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Database type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(config => config.db_type === filterType);
    }

    // Note: Operation filtering removed since we no longer store operation in config
    // Users can now perform both dump and restore operations on any config

    setFilteredConfigs(filtered);
  };

  const handleConfigSelect = (config: Config) => {
    navigate('/add-configuration', { state: { selectedConfig: config } });
  };

  const handleConfigDelete = async (configId: number) => {
    setModal({
      isOpen: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this configuration? This action cannot be undone.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await api.deleteConfig(configId);
          setConfigs(prev => prev.filter(config => config.id !== configId));
          setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
          });
          toast.success('Configuration deleted successfully');
        } catch (error) {
          console.error('Failed to delete configuration:', error);
          setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
          });
          toast.error('Failed to delete configuration');
        }
      }
    });
  };

  const handleStartOperation = async (config: Config, operationType: 'dump' | 'restore') => {
    setOperationStatus(prev => ({ ...prev, [config.id]: 'running' }));
    try {
      // Prepare the operation data with config_name instead of path
      const processData = {
        db_type: config.db_type,
        params: config.params,
        config_name: config.name,
        run_path: config.run_path,
        dump_file_name: config.dump_file_name
      };
      
      let result: AxiosResponse<OperationResponse>;
      if (operationType === 'dump') {
        result = await api.startDump(processData);
      } else {
        // Add restore-specific parameters for restore operations
        const restoreData = {
          ...processData,
          restore_password: config.restore_password,
          local_database_name: config.local_database_name,
          restore_username: config.restore_username,
          restore_host: config.restore_host,
          restore_port: config.restore_port,
          restore_stack_name: config.restore_stack_name,
        };
        result = await api.startRestore(restoreData);
      }
      if (result.data.success) {
        // Show simple message in toast
        toast.success(`✅ ${operationType} successful`);
        // Show detailed message in modal
        setModal({
          isOpen: true,
          title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Successful`,
          message: result.data.message || 'Operation completed successfully',
          type: 'success',
          contentType: 'preformatted'
        });
        setTimeout(() => {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'success' }));
        }, 2000);
      } else {
        setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
        // Show simple message in toast
        toast.error(`❌ ${operationType} failed`);
        // Show detailed error in modal
        setModal({
          isOpen: true,
          title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
          message: result.data.message || 'Operation failed with unknown error',
          type: 'error',
          contentType: 'preformatted'
        });
      }
    } catch (error: any) {
      setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
      console.error('Failed to start operation:', error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to start operation';
      
      // Show simple message in toast
      toast.error(`❌ ${operationType} failed`);
      
      // Show detailed error in modal
      setModal({
        isOpen: true,
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
        message: errorMessage,
        type: 'error',
        contentType: 'preformatted'
      });
    }
  };

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

  // getOperationIcon function removed - no longer needed

  return (
    <div className="configurations-page">
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
        autoCloseDelay={3000}
      />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.5rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-primary)',
            zIndex: 9999,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="container">
        <div className="page-header">
          <button 
            className="btn btn--secondary"
            onClick={() => navigate('/')}
          >
            <ArrowLeft />
            Back to Home
          </button>
          <h1>All Configurations</h1>
          <button 
            className="btn btn--primary"
            onClick={() => navigate('/add-configuration')}
          >
            <Plus />
            Add New
          </button>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search configurations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Database Type:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="redis">Redis</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
            
            {/* Operation filter removed - all configs can be used for both dump and restore */}
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <p>
            Showing {filteredConfigs.length} of {configs.length} configurations
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Configurations List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading configurations...</p>
          </div>
        ) : filteredConfigs.length > 0 ? (
          <div className="configurations-grid">
            {filteredConfigs.map((config) => {
              const hasStatus = !!operationStatus[config.id];
              return (
                <div key={config.id} className={`configuration-card${!hasStatus ? ' no-status-indicator' : ''}`}>
                  <div className="card-header">
                    <div className="config-icon-wrapper">
                      {getDatabaseIcon(config.db_type)}
                    </div>
                    <div className="config-info">
                      <h3>{config.name}</h3>
                      <div className="config-meta">
                        <span className="db-type">{config.db_type.toUpperCase()}</span>
                        <div className="operation-badge">
                          <span>Database Config</span>
                        </div>
                      </div>
                    </div>
                    {hasStatus && (
                      <div className="status-indicator">
                        {operationStatus[config.id] === 'running' && <Loader2 className="status-icon running" />}
                        {operationStatus[config.id] === 'success' && <span className="status-icon success">✔️</span>}
                        {operationStatus[config.id] === 'error' && <span className="status-icon error">❌</span>}
                        <span className="status-text">
                          {operationStatus[config.id] === 'running' && 'Running...'}
                          {operationStatus[config.id] === 'success' && 'Completed'}
                          {operationStatus[config.id] === 'error' && 'Failed'}
                        </span>
                      </div>
                    )}
                    <div className="card-actions">
                      <button 
                        className="btn btn--secondary btn-sm"
                        onClick={() => handleConfigSelect(config)}
                        title="Edit Configuration"
                      >
                        <Edit />
                      </button>
                      <button
                        className="btn btn--primary btn-sm"
                        onClick={() => handleStartOperation(config, 'dump')}
                        title="Dump (Download)"
                        disabled={operationStatus[config.id] === 'running'}
                      >
                        <Download />
                      </button>
                      <button
                        className="btn btn--primary btn-sm"
                        onClick={() => handleStartOperation(config, 'restore')}
                        title="Restore (Upload)"
                        disabled={operationStatus[config.id] === 'running'}
                      >
                        <Upload />
                      </button>
                      <button 
                        className="btn btn--danger btn-sm"
                        onClick={() => handleConfigDelete(config.id)}
                        title="Delete Configuration"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="config-params">
                      {Object.entries(config.params).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="param-item">
                          <span className="param-label">{key}:</span>
                          <span className="param-value">{String(value)}</span>
                        </div>
                      ))}
                      {Object.keys(config.params).length > 4 && (
                        <div className="param-item">
                          <span className="param-label">+{Object.keys(config.params).length - 4} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Database className="empty-icon" />
            <h3>No Configurations Found</h3>
            <p>
              {searchTerm || filterType !== 'all' || filterOperation !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first configuration to get started'
              }
            </p>
            <button 
              className="btn btn--primary"
              onClick={() => navigate('/add-configuration')}
            >
              <Plus />
              Create Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationsPage; 