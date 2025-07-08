import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Database, 
  Download, 
  Upload, 
  Settings, 
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  MoreVertical,
  Loader2
} from 'lucide-react';
import './ConfigurationsPage.scss';
import { api, Config } from '../api/client';
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
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [operationStatus, setOperationStatus] = useState<Record<number, 'idle' | 'running' | 'success' | 'error'>>({});
  const hasLoaded = useRef(false);

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

    // Operation filter
    if (filterOperation !== 'all') {
      filtered = filtered.filter(config => config.operation === filterOperation);
    }

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

  const handleStartOperation = async (config: Config) => {
    setOperationStatus(prev => ({ ...prev, [config.id]: 'running' }));
    try {
      const path = config.operation === 'dump' ? config.dump_path : config.restore_path;
      if (!path) {
        toast.error('No path specified for this configuration.');
        setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
        return;
      }
      const processData = {
        db_type: config.db_type,
        params: config.params,
        path,
        run_path: config.run_path
      };
      let result;
      if (config.operation === 'dump') {
        result = await api.startDump(processData);
      } else {
        result = await api.startRestore(processData);
      }
      if (result.data.success) {
        setOperationStatus(prev => ({ ...prev, [config.id]: 'success' }));
        toast.success(result.data.message || 'Operation completed successfully');
      } else {
        setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
        toast.error(result.data.message || 'Operation failed');
      }
    } catch (error: any) {
      setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
      console.error('Failed to start operation:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to start operation');
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

  const getOperationIcon = (operation: string) => {
    return operation === 'dump' ? <Download className="operation-icon" /> : <Upload className="operation-icon" />;
  };

  return (
    <div className="configurations-page">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
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
            
            <div className="filter-group">
              <label>Operation:</label>
              <select 
                value={filterOperation} 
                onChange={(e) => setFilterOperation(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Operations</option>
                <option value="dump">Dump</option>
                <option value="restore">Restore</option>
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
            {filteredConfigs.map((config) => (
              <div key={config.id} className="configuration-card">
                <div className="card-header">
                  <div className="config-icon-wrapper">
                    {getDatabaseIcon(config.db_type)}
                  </div>
                  <div className="config-info">
                    <h3>{config.name}</h3>
                    <div className="config-meta">
                      <span className="db-type">{config.db_type.toUpperCase()}</span>
                      <div className="operation-badge">
                        {getOperationIcon(config.operation)}
                        <span>{config.operation}</span>
                      </div>
                    </div>
                  </div>
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
                      onClick={() => handleStartOperation(config)}
                      title="Use Configuration"
                      disabled={operationStatus[config.id] === 'running'}
                    >
                      {operationStatus[config.id] === 'running' ? <Loader2 className="spinner" /> : <Play />}
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
            ))}
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