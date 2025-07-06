import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Database, FloppyDisk } from 'phosphor-react';

interface DumpModalProps {
  show: boolean;
  onHide: () => void;
  onExecute: (filename?: string) => Promise<void>;
  configName: string;
  loading?: boolean;
}

const DumpModal: React.FC<DumpModalProps> = ({
  show,
  onHide,
  onExecute,
  configName,
  loading = false
}) => {
  const [filename, setFilename] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await onExecute(filename.trim() || undefined);
      onHide();
      setFilename('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute dump');
    }
  };

  const handleClose = () => {
    setFilename('');
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Database size={20} className="me-2" />
          Create Database Dump
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p className="text-muted mb-3">
            Create a database dump for configuration: <strong>{configName}</strong>
          </p>
          
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Form.Group controlId="filename">
            <Form.Label>Dump Filename (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., my_database_backup"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Leave empty to use auto-generated name with timestamp. 
              The .dump extension will be added automatically.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Creating Dump...
              </>
            ) : (
              <>
                <FloppyDisk size={16} className="me-2" />
                Create Dump
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DumpModal; 