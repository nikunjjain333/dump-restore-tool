import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { useDatabaseState, useDatabase } from '../store';
import { Plus } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { ConfigCard, DeleteModal, ConfigTable } from './';
import { Config } from '../types';
import { DatabaseConfig } from '../context/DatabaseContext';

const ConfigList: React.FC = () => {
  const { configs, loading, error } = useDatabaseState();
  const [, dispatch] = useDatabase();
  const [operationStatus, setOperationStatus] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Reset operation status after 3 seconds
    const timer = setTimeout(() => {
      const newStatus = { ...operationStatus };
      Object.keys(newStatus).forEach(key => {
        if (newStatus[Number(key)] !== 'loading') {
          newStatus[Number(key)] = 'idle';
        }
      });
      setOperationStatus(newStatus);
    }, 3000);

    return () => clearTimeout(timer);
  }, [operationStatus]);

  const handleDump = async (id: number) => {
    setOperationStatus(prev => ({ ...prev, [id]: 'loading' }));
    try {
      await dispatch({ type: 'ADD_OPERATION', payload: { 
        id: Date.now(),
        config_id: id,
        operation_type: 'dump',
        status: 'started',
        created_at: new Date().toISOString()
      } });
      setOperationStatus(prev => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      console.error('Dump failed:', err);
      setOperationStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleRestore = async (id: number) => {
    setOperationStatus(prev => ({ ...prev, [id]: 'loading' }));
    try {
      await dispatch({ type: 'ADD_OPERATION', payload: { 
        id: Date.now(),
        config_id: id,
        operation_type: 'restore',
        status: 'started',
        created_at: new Date().toISOString()
      } });
      setOperationStatus(prev => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      console.error('Restore failed:', err);
      setOperationStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleViewOperations = (id: number) => {
    navigate(`/operations?configId=${id}&operation=restore`);
  };

  const handleDeleteClick = (id: number) => {
    setConfigToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (configToDelete !== null) {
      try {
        await dispatch({ type: 'DELETE_CONFIG', payload: configToDelete });
        setShowDeleteModal(false);
        setConfigToDelete(null);
      } catch (err) {
        console.error('Failed to delete config:', err);
      }
    }
  };

  if (loading && configs.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Database Configurations</h2>
        <Link to="/configs/new" className="btn btn-primary">
          <Plus size={20} className="me-2" />
          Add New Configuration
        </Link>
      </div>

      {configs.length > 0 ? (
        <ConfigTable
          configs={configs.map(convertToConfig)}
          operationStatus={operationStatus}
          onDump={handleDump}
          onRestore={handleRestore}
          onViewOperations={handleViewOperations}
          onDelete={handleDeleteClick}
        />
      ) : (
        <ConfigCard
          title="No Configurations Found"
          message="Get started by adding your first database configuration."
          buttonText="Add Configuration"
          buttonLink="/configs/new"
        />
      )}
      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Configuration"
        message="Are you sure you want to delete this configuration? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Container>
  );
};

// Helper function to convert DatabaseConfig to Config type
const convertToConfig = (dbConfig: DatabaseConfig): Config => ({
  id: dbConfig.id || 0, // Provide a default value for id if it's undefined
  name: dbConfig.name,
  db_type: dbConfig.db_type,
  database: dbConfig.database,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  operation: dbConfig.operation,
  created_at: dbConfig.created_at || new Date().toISOString(),
  updated_at: dbConfig.updated_at || new Date().toISOString()
});

export default ConfigList;