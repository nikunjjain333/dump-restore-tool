import React from 'react';
import { Home, Plus, Database } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './styles/App.scss';
import HomePage from './pages/HomePage';
import AddConfigurationPage from './pages/AddConfigurationPage';
import ConfigurationsPage from './pages/ConfigurationsPage';

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
        to="/add-configuration" 
        className={`nav-link ${location.pathname === '/add-configuration' ? 'active' : ''}`}
      >
        <Plus className="nav-icon" />
        Add Config
      </NavLink>
      <NavLink 
        to="/configurations" 
        className={`nav-link ${location.pathname === '/configurations' ? 'active' : ''}`}
      >
        <Database className="nav-icon" />
        Configurations
      </NavLink>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <Database className="logo-icon" />
              <h1>Database Dump & Restore Tool</h1>
            </div>
            <Navigation />
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add-configuration" element={<AddConfigurationPage />} />
            <Route path="/configurations" element={<ConfigurationsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 