import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Plus, 
  Zap, 
  Database, 
  Play, 
  Settings, 
  FolderOpen, 
  HardDrive,
  ArrowRight,
  Activity,
  CheckCircle,
  AlertCircle
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

const HomePage: React.FC<HomePageProps> = ({ dockerStatus, checkDockerStatus, isCheckingStatus }) => {
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

  const loadRecentConfigs = async () => {
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
  };

  const handleConfigSelect = (config: Config) => {
    navigate('/add-configuration', { state: { selectedConfig: config } });
  };

  return (
    <div className="home-page">
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
          loading: {
            iconTheme: {
              primary: 'var(--primary-blue)',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Database Management Made Simple</h1>
            <p>Efficiently dump and restore your databases with our powerful tool</p>
            <div className="hero-actions">
              <button 
                className="btn btn--highlight btn-lg"
                onClick={() => navigate('/add-configuration')}
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
            <div className="action-card" onClick={() => navigate('/add-configuration')}>
              <div className="action-icon">
                <Plus />
              </div>
              <h3>Add Configuration</h3>
              <p>Create a new database configuration for dump or restore operations</p>
            </div>
            <div className="action-card" onClick={() => navigate('/configurations')}>
              <div className="action-icon">
                <FolderOpen />
              </div>
              <h3>View Configurations</h3>
              <p>Browse and manage all your saved database configurations</p>
            </div>
            <div className="action-card">
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
                <div 
                  key={config.id} 
                  className="config-card-small"
                  onClick={() => handleConfigSelect(config)}
                >
                  <div className="config-icon">
                    <Database />
                  </div>
                  <div className="config-info">
                    <h4>{config.name}</h4>
                    <p>{config.db_type.toUpperCase()} • Database Config</p>
                  </div>
                  <ArrowRight className="arrow-icon" />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Database className="empty-icon" />
              <h3>No Configurations Yet</h3>
              <p>Create your first configuration to get started</p>
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
    </div>
  );
};

export default HomePage; 