import React, { useState } from 'react';
import { api, DockerComposeConfigCreate } from '../api/client';
import DockerComposeConfigForm from '../components/DockerComposeConfigForm';
import DockerComposeConfigList from '../components/DockerComposeConfigList';
import Modal from '../components/Modal';
import './DockerComposePage.scss';

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

interface DockerComposePageProps {
  dockerStatus: DockerStatus;
  checkDockerStatus: () => Promise<void>;
  isCheckingStatus: boolean;
}

const DockerComposePage: React.FC<DockerComposePageProps> = ({ 
  dockerStatus, 
  checkDockerStatus, 
  isCheckingStatus 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const handleSubmit = async (config: DockerComposeConfigCreate) => {
    try {
      setLoading(true);
      
      await api.createDockerComposeConfig(config);
      
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Docker Compose configuration added successfully!',
        type: 'success'
      });
      setShowForm(false);
    } catch (err: any) {
      console.error('Error creating Docker Compose config:', err);
      setModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to create Docker Compose configuration',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const handleRefresh = () => {
    // This will trigger a refresh of the config list
    // The list component handles its own refresh
  };

  return (
    <div className="docker-compose-page">
      <div className="page-header">
        <h1>Docker Compose Management</h1>
        <p>Manage your Docker Compose configurations and perform operations</p>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        autoClose={modal.type === 'success'}
        autoCloseDelay={5000}
      />

      <div className="page-actions">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '➕ Add Docker Compose Configuration'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <DockerComposeConfigForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      )}

      <div className="list-section">
        <DockerComposeConfigList onRefresh={handleRefresh} />
      </div>
    </div>
  );
};

export default DockerComposePage; 