import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  Loader2,
  Copy
} from 'lucide-react';
import './ConfigurationsPage.scss';
import { api, Config, OperationResponse } from '../api/client';
import type { AxiosResponse } from 'axios';
import Modal from '../components/Modal';
import { useOperationStatus } from '../contexts/OperationStatusContext';

const ConfigurationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
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
  const { operationStatus, setOperationStatus } = useOperationStatus();
  const hasLoaded = useRef(false);

  // Memoized filtered configurations
  const filteredConfigs = useMemo(() => {
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

    return filtered;
  }, [configs, searchTerm, filterType]);

  useEffect(() => {
    if (!hasLoaded.current) {
      loadConfigurations();
      hasLoaded.current = true;
    }
  }, []);

  const loadConfigurations = useCallback(async () => {
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
  }, []);

  const handleConfigSelect = useCallback((config: Config) => {
    navigate('/add-configuration', { state: { selectedConfig: config } });
  }, [navigate]);

  const handleConfigDuplicate = useCallback((config: Config) => {
    // Remove id and optionally modify name
    const duplicatedConfig = {
      ...config,
      id: undefined,
      name: config.name + ' Copy',
    };
    navigate('/add-configuration', { state: { selectedConfig: duplicatedConfig, isDuplicate: true } });
  }, [navigate]);

  const handleConfigDelete = useCallback(async (configId: number) => {
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
  }, []);

  const handleStartOperation = useCallback(async (config: Config, operationType: 'dump' | 'restore') => {
    setOperationStatus(config.id, 'running');
    try {
      // Prepare the operation data with config_name instead of path
      const processData = {
        db_type: config.db_type,
        params: config.params,
        config_name: config.name,
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
          setOperationStatus(config.id, 'success');
        }, 2000);
      } else {
        setOperationStatus(config.id, 'error');
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
      setOperationStatus(config.id, 'error');
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
  }, [setOperationStatus]);

  const getDatabaseIcon = useCallback((dbType: string) => {
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
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  }, []);

  const handleBackClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleAddNewClick = useCallback(() => {
    navigate('/add-configuration');
  }, [navigate]);

  const handleCreateConfigClick = useCallback(() => {
    navigate('/add-configuration');
  }, [navigate]);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Memoized toast options
  const toastOptions = useMemo(() => ({
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
  }), []);

  return (
    <div className="configurations-page">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
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
      
      <div className="container">
        <div className="page-header">
          <button 
            className="btn btn--secondary"
            onClick={handleBackClick}
          >
            <ArrowLeft />
            Back to Home
          </button>
          <h1>All Configurations</h1>
          <button 
            className="btn btn--primary"
            onClick={handleAddNewClick}
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
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Database Type:</label>
              <select 
                value={filterType} 
                onChange={handleFilterTypeChange}
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
                  <div className="card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: '0.7rem', marginBottom: '0.1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <div className="config-icon-wrapper" style={{ width: '2.2rem', height: '2.2rem' }}>
                          {getDatabaseIcon(config.db_type)}
                        </div>
                        <div className="operation-badge" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                          Database Config
                        </div>
                      </div>
                      <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          className="btn btn--secondary btn-sm"
                          onClick={() => handleConfigSelect(config)}
                          title="Edit Configuration"
                        >
                          <Edit />
                        </button>
                        <button
                          className="btn btn--secondary btn-sm"
                          onClick={() => handleConfigDuplicate(config)}
                          title="Duplicate Configuration"
                        >
                          <Copy />
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
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.2rem 0 0.5rem 0', textAlign: 'left', letterSpacing: '0.01em' }}>{config.name}</h3>
                    <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-start', marginTop: '0.2rem' }}>
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
                    </div>
                    {hasStatus && (
                      <div className="status-indicator" style={{ position: 'absolute', top: '-0.7rem', right: '1rem' }}>
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
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first configuration to get started'
              }
            </p>
            <button 
              className="btn btn--primary"
              onClick={handleCreateConfigClick}
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