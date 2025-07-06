import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Toast, ToastContainer, Button, ProgressBar } from 'react-bootstrap';
import { Plus, X, Download } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { ConfigCard, DeleteModal, ConfigTable } from './';
import axios from 'axios';
import { DatabaseConfig, useDatabase } from '../context/DatabaseContext';

const ConfigList: React.FC = () => {
  const { configs, loading, error, deleteConfig } = useDatabase();
  type OperationStatusType = 'idle' | 'loading' | 'success' | 'error';
  const [operationStatus, setOperationStatus] = useState<Record<number, OperationStatusType>>({});
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [configToDelete, setConfigToDelete] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [activeOperations, setActiveOperations] = useState<Record<number, OperationStatus>>({});
  const navigate = useNavigate();

  // Poll for operation status
  useEffect(() => {
    const interval = setInterval(() => {
      Object.entries(activeOperations).forEach(([configIdStr, operation]) => {
        const configId = parseInt(configIdStr, 10);
        if (operation && (operation.status === 'in_progress' || operation.status === 'started')) {
          checkOperationStatus(operation.id, configId);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeOperations]);

  interface OperationStatus {
    id: string;
    configId: number;
    status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    startTime: string;
    filePath?: string;
    error?: string;
  }

  const checkOperationStatus = async (operationId: string, configId: number) => {
    try {
      const response = await axios.get<{
        status: string;
        progress?: number;
        file_path?: string;
        error?: string;
      }>(`/api/operations/${operationId}/status`);
      
      const { status, progress, file_path, error } = response.data;
      
      setActiveOperations((prev: Record<number, OperationStatus>) => ({
        ...prev,
        [configId]: {
          ...(prev[configId] || {}),
          id: operationId,
          configId,
          status: status as OperationStatus['status'],
          progress: progress || 0,
          filePath: file_path,
          error,
          startTime: prev[configId]?.startTime || new Date().toISOString()
        }
      }));

      if (status === 'completed' || status === 'failed') {
        // Remove from active operations after a delay
        setTimeout(() => {
          setActiveOperations(prev => {
            const newOps = { ...prev };
            delete newOps[configId];
            return newOps;
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Error checking operation status:', error);
    }
  };

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
    try {
      setOperationStatus(prev => ({ ...prev, [id]: 'loading' }));
      
      // Start the dump operation
      const response = await axios.post<{ operation_id: string }>(`/api/operations/${id}/dump`);
      const { operation_id } = response.data;
      
      // Add to active operations
      setActiveOperations(prev => ({
        ...prev,
        [id]: {
          id: operation_id,
          configId: id,
          status: 'started',
          progress: 0,
          startTime: new Date().toISOString()
        } as OperationStatus
      }));
      
      setToastMessage('Dump operation started. You can monitor progress below.');
      setShowToast(true);
      setOperationStatus(prev => ({ ...prev, [id]: 'success' }));
      
    } catch (error: unknown) {
      console.error('Failed to start dump:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        : 'Failed to start dump operation';
      setToastMessage(errorMessage || 'Failed to start dump operation');
      setShowToast(true);
      setOperationStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  };
  
  const handleDownloadDump = async (operationId: string) => {
    try {
      // This will trigger a file download
      window.open(`/api/operations/${operationId}/download`, '_blank');
    } catch (error) {
      console.error('Failed to download dump:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download dump file';
      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };
  
  const handleCancelOperation = async (operationId: string, configId: number) => {
    try {
      await axios.get(`/api/operations/${operationId}/cancel`);
      setToastMessage('Operation cancellation requested');
      setShowToast(true);
      
      // Update operation status to reflect cancellation
      setActiveOperations(prev => ({
        ...prev,
        [configId]: {
          ...(prev[configId] || {}),
          status: 'cancelled',
          progress: prev[configId]?.progress || 0
        }
      }));
    } catch (error) {
      console.error('Failed to cancel operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel operation';
      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };

  const handleRestore = async (id: number) => {
    setOperationStatus(prev => ({ ...prev, [id]: 'loading' }));
    try {
      // This would be handled by the context system
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
    if (configToDelete) {
      try {
        await deleteConfig(configToDelete);
        setToastMessage('Configuration deleted successfully');
        setShowToast(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
        setToastMessage(errorMessage);
        setShowToast(true);
      }
      setShowDeleteModal(false);
      setConfigToDelete(null);
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

  // Render operation status toasts
  const renderOperationToasts = () => (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 11 }}>
      {Object.entries(activeOperations).map(([configIdStr, op]) => {
        const configId = parseInt(configIdStr, 10);
        return (
          <Toast 
            key={op.id}
            className="mb-2"
            onClose={() => {
              setActiveOperations(prev => {
                const newOps = { ...prev };
                delete newOps[configId];
                return newOps;
              });
            }}
          >
            <Toast.Header closeButton>
              <strong className="me-auto">
                {op.status === 'completed' ? '✅' : op.status === 'failed' ? '❌' : '⏳'} 
                Dump {op.status}
              </strong>
            </Toast.Header>
            <Toast.Body>
              <div className="mb-2">
                <div className="d-flex justify-content-between mb-1">
                  <small>Progress: {op.progress}%</small>
                  <small>
                    {op.status === 'in_progress' && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 text-danger"
                        onClick={() => handleCancelOperation(op.id, configId)}
                      >
                        <X size={16} /> Cancel
                      </Button>
                    )}
                  </small>
                </div>
                <ProgressBar 
                  now={op.progress} 
                  variant={op.status === 'failed' ? 'danger' : 'success'}
                  animated={op.status === 'in_progress'}
                />
              </div>
              
              {op.status === 'completed' && op.filePath && (
                <div className="d-grid gap-2">
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleDownloadDump(op.id)}
                  >
                    <Download size={16} className="me-1" /> Download Dump
                  </Button>
                </div>
              )}
              
              {op.error && (
                <div className="text-danger small mt-2">
                  Error: {op.error}
                </div>
              )}
            </Toast.Body>
          </Toast>
        );
      })}
      
      <Toast show={showToast} onClose={() => setShowToast(false)} delay={5000} autohide>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </ToastContainer>
  );

  return (
    <Container className="py-4">
      {renderOperationToasts()}

      {configs.length > 0 ? (
        <ConfigTable
          configs={configs}
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

export default ConfigList;