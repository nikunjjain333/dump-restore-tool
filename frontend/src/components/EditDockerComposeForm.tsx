import React, { useState, useEffect } from 'react';
import { DockerComposeConfig, DockerComposeConfigCreate } from '../api/client';
import './EditDockerComposeForm.scss';

// Function to convert host path to container path
const convertHostPathToContainerPath = (hostPath: string): string => {
  // Remove leading slash if present
  const cleanPath = hostPath.startsWith('/') ? hostPath.slice(1) : hostPath;
  
  // If path starts with Users/username, convert to /home
  if (cleanPath.startsWith('Users/')) {
    const parts = cleanPath.split('/');
    if (parts.length >= 3) {
      // Remove 'Users' and username, keep the rest
      const remainingPath = parts.slice(2).join('/');
      return `/home/${remainingPath}`;
    }
  }
  
  // If it's already a container path (starts with /home), return as is
  if (cleanPath.startsWith('home/')) {
    return `/${cleanPath}`;
  }
  
  // For other paths, assume they should be prefixed with /home
  return `/home/${cleanPath}`;
};

interface EditDockerComposeFormProps {
  config: DockerComposeConfig;
  onSubmit: (config: DockerComposeConfigCreate) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EditDockerComposeForm: React.FC<EditDockerComposeFormProps> = ({ 
  config, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: config.name,
    path: config.path,
    service_name: config.service_name || '',
    description: config.description || '',
    flags: config.flags || {}
  });
  const [pathValue, setPathValue] = useState(config.path);
  const [convertedPath, setConvertedPath] = useState('');

  // Initialize path conversion on component mount
  useEffect(() => {
    const containerPath = convertHostPathToContainerPath(config.path);
    setConvertedPath(containerPath);
  }, [config.path]);

  const handlePathChange = (value: string) => {
    setPathValue(value);
    const containerPath = convertHostPathToContainerPath(value);
    setConvertedPath(containerPath);
    setFormData(prev => ({ ...prev, path: containerPath }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <div className="form-group">
        <label htmlFor="edit-name">Configuration Name *</label>
        <input
          type="text"
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-path">Docker Compose Path *</label>
        <input
          type="text"
          id="edit-path"
          value={pathValue}
          onChange={(e) => handlePathChange(e.target.value)}
          placeholder="e.g., /Documents/mso-treez-pay"
          required
          disabled={loading}
        />
        {convertedPath && convertedPath !== pathValue && (
          <div className="path-conversion-info">
            <small>
              <strong>Container path:</strong> {convertedPath}
              <br />
              <em>This path will be used inside the Docker container</em>
            </small>
          </div>
        )}
        <div className="path-help-text">
          <small>
            <strong>Tip:</strong> Enter the relative path from your home directory. 
            For example, if your docker-compose.yml is at <code>/Users/username/Documents/my-project/</code>, 
            just enter <code>/Documents/my-project</code>
          </small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="edit-service">Service Name (Optional)</label>
        <input
          type="text"
          id="edit-service"
          value={formData.service_name}
          onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
          placeholder="Specific service to operate on"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-description">Description (Optional)</label>
        <textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Configuration description"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Configuration'}
        </button>
      </div>
    </form>
  );
};

export default EditDockerComposeForm; 