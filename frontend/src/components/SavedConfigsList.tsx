import React from 'react';
import { Config } from '../api/client';
import './SavedConfigsList.scss';

interface SavedConfigsListProps {
  configs: Config[];
  onSelect: (config: Config) => void;
}

const SavedConfigsList: React.FC<SavedConfigsListProps> = ({ configs, onSelect }) => {
  if (configs.length === 0) {
    return (
      <div className="saved-configs-list">
        <p>No saved configurations found.</p>
      </div>
    );
  }

  return (
    <div className="saved-configs-list">
      <h3>Saved Configurations</h3>
      <div className="configs-grid">
        {configs.map((config) => (
          <div key={config.id} className="config-card" onClick={() => onSelect(config)}>
            <h4>{config.name}</h4>
            <p><strong>Database:</strong> {config.db_type}</p>
            <p><strong>Operation:</strong> {config.operation}</p>
            <button type="button" className="btn btn-secondary">
              Load Configuration
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedConfigsList; 