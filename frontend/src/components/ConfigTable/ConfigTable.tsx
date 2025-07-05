import React from 'react';
import { Table } from 'react-bootstrap';
import { HardDrives } from 'phosphor-react';
import { ActionButtons } from '../ActionButtons';
import { Config } from '../../types';
import { ConfigTableProps } from './types';
import styles from './styles/ConfigTable.module.scss';

export const ConfigTable: React.FC<ConfigTableProps> = ({
  configs,
  operationStatus,
  onDump,
  onRestore,
  onViewOperations,
  onDelete,
}) => {
  if (configs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <HardDrives size={48} className="mb-3" />
        <p>No configurations found</p>
      </div>
    );
  }

  return (
    <div className={styles.configTable}>
      <Table hover className="align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Database</th>
            <th>Host</th>
            <th>Operation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr key={config.id}>
              <td>
                <div className={styles.configName}>
                  <HardDrives size={20} className="me-2 text-primary" />
                  <strong>{config.name}</strong>
                </div>
              </td>
              <td>
                <span className={`${styles.badge} ${config.db_type === 'postgres' ? styles.infoBadge : styles.successBadge}`}>
                  {config.db_type.toUpperCase()}
                </span>
              </td>
              <td>{config.database}</td>
              <td>
                <div className={styles.hostInfo}>
                  {config.host}:{config.port}
                </div>
              </td>
              <td>
                <span className={`${styles.badge} ${config.operation === 'dump' ? styles.primaryBadge : styles.warningBadge}`}>
                  {config.operation.toUpperCase()}
                </span>
              </td>
              <td>
                <ActionButtons
                  config={config}
                  operationStatus={operationStatus[config.id] || 'idle'}
                  onDump={onDump}
                  onRestore={onRestore}
                  onViewOperations={onViewOperations}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ConfigTable;
