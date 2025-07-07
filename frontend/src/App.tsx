import React, { useState, useEffect, useRef } from 'react';
import { Home, Plus, Database, Container } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './styles/App.scss';
import HomePage from './pages/HomePage';
import AddConfigurationPage from './pages/AddConfigurationPage';
import ConfigurationsPage from './pages/ConfigurationsPage';
import DockerComposePage from './pages/DockerComposePage';
import { api, DockerResponse } from './api/client';

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

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="nav-menu">
      <NavLink 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        <Home className="nav-icon" />
        Home
      </NavLink>
      <NavLink 
        to="/configurations" 
        className={`nav-link ${location.pathname === '/configurations' ? 'active' : ''}`}
      >
        <Database className="nav-icon" />
        Configurations
      </NavLink>
      <NavLink 
        to="/docker-compose" 
        className={`nav-link ${location.pathname === '/docker-compose' ? 'active' : ''}`}
      >
        <Container className="nav-icon" />
        Docker Compose
      </NavLink>
    </nav>
  );
};

const App: React.FC = () => {
  const [dockerStatus, setDockerStatus] = useState<DockerStatus>({
    isRunning: false,
    status: 'unknown'
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const hasInitialized = useRef(false);
  const currentRequestId = useRef(0);

  // Initialize with unknown status (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setDockerStatus({
        isRunning: false,
        status: 'unknown'
      });
    }
  }, []);

  const checkDockerStatus = async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingStatus) {
      return;
    }
    
    const requestId = ++currentRequestId.current;
    setIsCheckingStatus(true);
    try {
      const response = await api.getDockerStatus();
      
      // Check if this is still the current request
      if (requestId !== currentRequestId.current) {
        return;
      }
      
      const { success, status, info } = response.data;
      
      setDockerStatus({
        isRunning: success && status === 'running',
        status: status,
        info: info
      });
    } catch (error) {
      console.error('Failed to check Docker status:', error);
      setDockerStatus({
        isRunning: false,
        status: 'error'
      });
    } finally {
      // Only reset if this is still the current request
      if (requestId === currentRequestId.current) {
        setIsCheckingStatus(false);
      }
    }
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <Database className="logo-icon" />
              <h1>DB Dump & Restore Tool</h1>
            </div>
            <Navigation />
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage dockerStatus={dockerStatus} checkDockerStatus={checkDockerStatus} isCheckingStatus={isCheckingStatus} />} />
            <Route path="/add-configuration" element={<AddConfigurationPage />} />
            <Route path="/configurations" element={<ConfigurationsPage />} />
            <Route path="/docker-compose" element={<DockerComposePage dockerStatus={dockerStatus} checkDockerStatus={checkDockerStatus} isCheckingStatus={isCheckingStatus} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 