import React, { useState } from 'react';
import { api, DockerComposeConfigCreate } from '../api/client';
import DockerComposeConfigForm from '../components/DockerComposeConfigForm';
import DockerComposeConfigList from '../components/DockerComposeConfigList';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (config: DockerComposeConfigCreate) => {
    try {
      setLoading(true);
      setMessage(null);
      
      await api.createDockerComposeConfig(config);
      
      setMessage({ type: 'success', text: 'Docker Compose configuration added successfully!' });
      setShowForm(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error creating Docker Compose config:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to create Docker Compose configuration' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setMessage(null);
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

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="message-close"
          >
            ×
          </button>
        </div>
      )}

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