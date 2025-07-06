import React from 'react';
import { Button } from 'react-bootstrap';
import { Play, ClockCounterClockwise, Trash, ListChecks } from 'phosphor-react';
import { StatusBadge } from '../StatusBadge';
import { ActionButtonsProps } from './types';
import styles from './styles/ActionButtons.module.scss';

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  config,
  operationStatus,
  onDump,
  onRestore,
  onViewOperations,
  onDelete,
}) => {
  const handleClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div className={styles.actionButtons}>
      {config.operation === 'dump' ? (
        <>
          <Button
            variant="outline-primary"
            size="sm"
            className="me-2"
            onClick={(e) => handleClick(e, () => onDump(config.id))}
            disabled={operationStatus === 'loading'}
          >
            {operationStatus === 'loading' ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Dumping...
              </>
            ) : (
              <>
                <StatusBadge status={operationStatus} />
                <Play size={16} className="me-1" />
                Dump
              </>
            )}
          </Button>
        </>
      ) : (
        <Button
          variant="outline-success"
          size="sm"
          className="me-2"
          onClick={(e) => handleClick(e, () => onRestore(config.id))}
          disabled={operationStatus === 'loading'}
        >
          {operationStatus === 'loading' ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Restoring...
            </>
          ) : (
            <>
              <StatusBadge status={operationStatus} />
              <ClockCounterClockwise size={16} className="me-1" />
              Restore
            </>
          )}
        </Button>
      )}
      
      <Button
        variant="outline-secondary"
        size="sm"
        className="me-2"
        onClick={(e) => handleClick(e, () => onViewOperations(config.id))}
      >
        <ListChecks size={16} />
      </Button>
      
      <Button
        variant="outline-danger"
        size="sm"
        onClick={(e) => handleClick(e, () => onDelete(config.id))}
        title="Delete Configuration"
      >
        <Trash size={16} />
      </Button>
    </div>
  );
};

export default ActionButtons;
