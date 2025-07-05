import React from 'react';
import { Spinner } from 'react-bootstrap';
import { CheckCircle, XCircle } from 'phosphor-react';
import { StatusBadgeProps } from './types';
import styles from './styles/StatusBadge.module.scss';

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 16,
  className = ''
}) => {
  switch (status) {
    case 'loading':
      return <Spinner animation="border" size="sm" className={`${styles.loading} ${className}`} />;
    case 'success':
      return <CheckCircle size={size} className={`${styles.success} ${className}`} />;
    case 'error':
      return <XCircle size={size} className={`${styles.error} ${className}`} />;
    default:
      return null;
  }
};

export default StatusBadge;
