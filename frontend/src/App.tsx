import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
import { FC } from 'react';

// Components
import Navigation from './components/Navigation';
import Home from './pages/Home';
import ConfigList from './components/ConfigList';
import ConfigForm from './pages/ConfigForm';
import Operations from './pages/Operations';

// State Management
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';

// This component initializes data when the app loads
const AppInitializer: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fetchConfigs, fetchOperations } = useDatabase();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Run these in parallel since they don't depend on each other
        await Promise.all([
          fetchConfigs(),
          fetchOperations()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
  }, [fetchConfigs, fetchOperations]);

  return <>{children}</>;
};

const App: FC = () => {
  return (
    <DatabaseProvider>
      <AppInitializer>
        <div className="app">
          <Navigation />
          <Container className="mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/configs" element={<ConfigList />} />
              <Route path="/configs/new" element={<ConfigForm />} />
              <Route path="/configs/:id" element={<ConfigForm />} />
              <Route path="/operations" element={<Operations />} />
            </Routes>
          </Container>
        </div>
      </AppInitializer>
    </DatabaseProvider>
  );
};

export default App;
