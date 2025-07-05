import React from 'react';
import { Card } from 'react-bootstrap';
import { Database, Plus } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { ConfigCardProps } from './types';
import styles from './styles/ConfigCard.module.scss';

export const ConfigCard: React.FC<ConfigCardProps> = ({
  title,
  message,
  buttonText,
  buttonLink,
}) => {
  return (
    <Card className={`${styles.configCard} text-center p-5`}>
      <Database size={48} className="text-muted mb-3 mx-auto" />
      <Card.Title as="h4">{title}</Card.Title>
      <Card.Text className="text-muted mb-4">{message}</Card.Text>
      <Link to={buttonLink} className={`btn btn-primary ${styles.cardButton}`}>
        <Plus size={20} className="me-2" />
        {buttonText}
      </Link>
    </Card>
  );
};

export default ConfigCard;
