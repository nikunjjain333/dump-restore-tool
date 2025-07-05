import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import { DatabaseProvider as StoreDatabaseProvider, useDatabaseDispatch, fetchConfigs, fetchOperations } from './store';
import { DatabaseProvider as ContextDatabaseProvider } from './context/DatabaseContext';

// This component initializes data when the app loads
const AppInitializer: FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDatabaseDispatch();
  const location = useLocation();

  useEffect(() => {
    const initializeData = async () => {
      await fetchConfigs(dispatch);
      await fetchOperations(dispatch);
    };
    
    initializeData();
  }, [dispatch]);

  return <>{children}</>;
};

const App: FC = () => {
  return (
    <StoreDatabaseProvider>
      <ContextDatabaseProvider>
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
      </ContextDatabaseProvider>
    </StoreDatabaseProvider>
  );
};

export default App;
