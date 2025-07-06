import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner, Container } from 'react-bootstrap';
import { DatabaseType, OperationType, useDatabase } from '../context/DatabaseContext';

const ConfigForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { saveConfig, getConfig, loading, error } = useDatabase();

  const [formData, setFormData] = useState({
    name: '',
    db_type: 'postgres' as DatabaseType,
    operation: 'dump' as OperationType,
    host: 'localhost',
    port: 5432,
    username: '',
    password: '',
    database: '',
    dump_path: '',
    restore_path: '',
    filename: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load config data if in edit mode
  useEffect(() => {
    const loadConfig = async () => {
      if (isEditMode && id) {
        try {
          const config = await getConfig(parseInt(id));
          setFormData({
            name: config.name,
            db_type: config.db_type,
            operation: config.operation,
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            dump_path: config.dump_path,
            restore_path: config.restore_path || '',
            filename: config.filename || '',
          });
        } catch (err) {
          console.error('Error loading config:', err);
        }
      }
    };

    loadConfig();
  }, [id, isEditMode, getConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle number fields
    if (name === 'port') {
      const portValue = value ? parseInt(value, 10) : 0;
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(portValue) ? 0 : portValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.host.trim()) {
      errors.host = 'Host is required';
    }
    
    if (!formData.port) {
      errors.port = 'Port is required';
    } else if (isNaN(Number(formData.port)) || Number(formData.port) < 1 || Number(formData.port) > 65535) {
      errors.port = 'Port must be a valid number between 1 and 65535';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    if (!formData.database.trim()) {
      errors.database = 'Database name is required';
    }
    
    if (!formData.dump_path.trim()) {
      errors.dump_path = 'Dump path is required';
    }
    
    if (formData.operation === 'restore' && !formData.restore_path?.trim()) {
      errors.restore_path = 'Restore path is required for restore operations';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await saveConfig({
        ...formData,
        id: isEditMode && id ? parseInt(id, 10) : undefined
      });
      navigate('/configs');
    } catch (err) {
      console.error('Error saving configuration:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (fieldName: string) => {
    return validationErrors[fieldName] ? 'is-invalid' : '';
  };

  if (loading && isEditMode) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <div className="config-form">
      <h2 className="mb-4">{isEditMode ? 'Edit Configuration' : 'New Configuration'}</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Configuration Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={getInputClass('name')}
                placeholder="e.g., Production DB Backup"
                disabled={isSubmitting}
              />
              {validationErrors.name && (
                <Form.Control.Feedback type="invalid">
                  {validationErrors.name}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Database Type *</Form.Label>
                  <Form.Select
                    name="db_type"
                    value={formData.db_type}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Operation *</Form.Label>
                  <Form.Select
                    name="operation"
                    value={formData.operation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="dump">Dump</option>
                    <option value="restore">Restore</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            
            <h5 className="mt-4 mb-3">Database Connection</h5>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Host *</Form.Label>
                  <Form.Control
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    className={getInputClass('host')}
                    placeholder="localhost"
                    disabled={isSubmitting}
                  />
                  {validationErrors.host && (
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.host}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Port *</Form.Label>
                  <Form.Control
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className={getInputClass('port')}
                    placeholder={formData.db_type === 'postgres' ? '5432' : '3306'}
                    min={1}
                    max={65535}
                    disabled={isSubmitting}
                  />
                  {validationErrors.port && (
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.port}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={getInputClass('username')}
                    placeholder="Database username"
                    disabled={isSubmitting}
                  />
                  {validationErrors.username && (
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.username}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={getInputClass('password')}
                    placeholder="Database password"
                    disabled={isSubmitting}
                  />
                  {validationErrors.password && (
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.password}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Database Name *</Form.Label>
              <Form.Control
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                className={getInputClass('database')}
                placeholder="Database name"
                disabled={isSubmitting}
              />
              {validationErrors.database && (
                <Form.Control.Feedback type="invalid">
                  {validationErrors.database}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Dump Path *</Form.Label>
              <Form.Control
                type="text"
                name="dump_path"
                value={formData.dump_path}
                onChange={handleChange}
                className={getInputClass('dump_path')}
                placeholder="e.g., /path/to/dumps"
                disabled={isSubmitting}
              />
              <Form.Text className="text-muted">
                Directory where database dumps will be saved
              </Form.Text>
              {validationErrors.dump_path && (
                <Form.Control.Feedback type="invalid">
                  {validationErrors.dump_path}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            
            {formData.operation === 'dump' && (
              <Form.Group className="mb-3">
                <Form.Label>Default Dump Filename (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="filename"
                  value={formData.filename}
                  onChange={handleChange}
                  placeholder="e.g., my_database_backup"
                  disabled={isSubmitting}
                />
                <Form.Text className="text-muted">
                  Default filename for database dumps. Leave empty to use auto-generated names with timestamps.
                  The .dump extension will be added automatically.
                </Form.Text>
              </Form.Group>
            )}
            
            {formData.operation === 'restore' && (
              <Form.Group className="mb-4">
                <Form.Label>Restore Path *</Form.Label>
                <Form.Control
                  type="text"
                  name="restore_path"
                  value={formData.restore_path}
                  onChange={handleChange}
                  className={getInputClass('restore_path')}
                  placeholder="e.g., /path/to/backup.sql"
                  disabled={isSubmitting}
                />
                <Form.Text className="text-muted">
                  Path to the SQL file to restore from
                </Form.Text>
                {validationErrors.restore_path && (
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.restore_path}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            )}
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditMode ? (
                  'Update Configuration'
                ) : (
                  'Create Configuration'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ConfigForm;
