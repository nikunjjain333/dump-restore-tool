import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Zap, 
  Database, 
  Play, 
  Settings, 
  FolderOpen, 
  HardDrive,
  ArrowRight,
  Activity
} from 'lucide-react';
import './HomePage.scss';
import { api, Config } from '../api/client';
import DockerButton from '../components/DockerButton';

interface DockerStatus {
  isRunning: boolean;
  status: string;
  info?: {
    containers: number;
    images: number;
    version: string;
    os: string;
    architecture: string;
  };
}

interface HomePageProps {
  dockerStatus: DockerStatus;
  checkDockerStatus: () => Promise<void>;
  isCheckingStatus: boolean;
}

const HomePage: React.FC<HomePageProps> = React.memo(({ dockerStatus, checkDockerStatus, isCheckingStatus }) => {
  const navigate = useNavigate();
  const [recentConfigs, setRecentConfigs] = useState<Config[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const hasInitialized = useRef(false);

  // Load recent configs on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadRecentConfigs();
    }
  }, []);

  const loadRecentConfigs = useCallback(async () => {
    setIsLoadingConfigs(true);
    try {
      const response = await api.getConfigs();
      // Get the 3 most recent configs
      const recent = response.data.slice(-3).reverse();
      setRecentConfigs(recent);
    } catch (error) {
      console.error('Failed to load recent configs:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  }, []);

  const handleConfigSelect = useCallback((config: Config) => {
    navigate('/add-configuration', { state: { selectedConfig: config } });
  }, [navigate]);

  const handleCreateNewConfig = useCallback(() => {
    navigate('/add-configuration');
  }, [navigate]);

  const handleViewConfigurations = useCallback(() => {
    navigate('/configurations');
  }, [navigate]);

  const handleQuickStart = useCallback(() => {
    navigate('/add-configuration');
  }, [navigate]);

  // Memoized toast options
  const toastOptions = useMemo(() => ({
    position: "top-right" as const,
    toastOptions: {
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
      loading: {
        iconTheme: {
          primary: 'var(--primary-blue)',
          secondary: '#fff',
        },
      },
    },
  }), []);

  return (
    <div className="home-page">
      <div className="container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Database Management Made Simple</h1>
            <p>Efficiently dump and restore your databases with our powerful tool</p>
            <div className="hero-actions">
              <button 
                className="btn btn--highlight btn-lg"
                onClick={handleCreateNewConfig}
              >
                <Plus />
                Create New Configuration
                <ArrowRight />
              </button>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <Database className="stat-icon" />
              <div className="stat-content">
                <h3>5</h3>
                <p>Database Types</p>
              </div>
            </div>
            <div className="stat-card">
              <Settings className="stat-icon" />
              <div className="stat-content">
                <h3>2</h3>
                <p>Operations</p>
              </div>
            </div>
            <div className="stat-card">
              <Activity className="stat-icon" />
              <div className="stat-content">
                <h3>Fast</h3>
                <p>Performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Docker Control Section */}
        <div className="section">
          <div className="section__header">
            <Zap className="icon" />
            <h2>Docker Control</h2>
          </div>
          <DockerButton 
            dockerStatus={dockerStatus}
            checkDockerStatus={checkDockerStatus}
            isCheckingStatus={isCheckingStatus}
          />
        </div>

        {/* Quick Actions */}
        <div className="section">
          <div className="section__header">
            <Play className="icon" />
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <div className="action-card" onClick={handleCreateNewConfig}>
              <div className="action-icon">
                <Plus />
              </div>
              <h3>Add Configuration</h3>
              <p>Create a new database configuration for dump or restore operations</p>
            </div>
            <div className="action-card" onClick={handleViewConfigurations}>
              <div className="action-icon">
                <FolderOpen />
              </div>
              <h3>View Configurations</h3>
              <p>Browse and manage all your saved database configurations</p>
            </div>
            <div className="action-card" onClick={handleQuickStart}>
              <div className="action-icon">
                <HardDrive />
              </div>
              <h3>Quick Start</h3>
              <p>Start a database operation with default settings</p>
            </div>
          </div>
        </div>

        {/* Recent Configurations */}
        <div className="section">
          <div className="section__header">
            <Database className="icon" />
            <h2>Recent Configurations</h2>
          </div>
          {isLoadingConfigs ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading recent configurations...</p>
            </div>
          ) : recentConfigs.length > 0 ? (
            <div className="recent-configs">
              {recentConfigs.map((config) => (
                <div key={config.id} className="config-card" onClick={() => handleConfigSelect(config)}>
                  <div className="card-header">
                    <div className="config-icon-wrapper">
                      <Database className="config-icon" />
                    </div>
                    <div className="config-info">
                      <h3>{config.name}</h3>
                      <div className="config-meta">
                        <span className="db-type">{config.db_type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="config-params">
                      {Object.entries(config.params).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="param-item">
                          <span className="param-label">{key}:</span>
                          <span className="param-value">{String(value)}</span>
                        </div>
                      ))}
                      {Object.keys(config.params).length > 2 && (
                        <div className="param-item">
                          <span className="param-label">+{Object.keys(config.params).length - 2} more</span>
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
              <h3>No Recent Configurations</h3>
              <p>Create your first configuration to get started</p>
              <button 
                className="btn btn--primary"
                onClick={handleCreateNewConfig}
              >
                <Plus />
                Create Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage; 