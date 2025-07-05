import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Badge, 
  Alert, 
  Spinner, 
  Container, 
  Card, 
  Form,
  Row,
  Col
} from 'react-bootstrap';
import { 
  ArrowClockwise, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play,
  ClockCounterClockwise,
  Funnel,
  X
} from 'phosphor-react';
import { useDatabase, type OperationLog, type DatabaseConfig } from '../context/DatabaseContext';

// Add JSX namespace for React 18
import * as ReactJSX from 'react';
declare global {
  namespace JSX {
    interface Element extends ReactJSX.JSX.Element {}
  }
}
import { formatDistanceToNow } from 'date-fns';

type OperationType = 'dump' | 'restore';
type StatusType = 'started' | 'completed' | 'failed';

const Operations: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { configs, operations, fetchOperations, executeDump, executeRestore } = useDatabase();
  
  // State for filtering
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<number | 'all'>('all');
  const [operationType, setOperationType] = useState<'all' | OperationType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all');
  const [isExecuting, setIsExecuting] = useState<{[key: string]: boolean}>({});
  
  // Get URL params for pre-selecting config and operation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const configId = params.get('configId');
    const opType = params.get('operation');
    
    if (configId) {
      setSelectedConfig(parseInt(configId, 10));
    }
    
    if (opType === 'dump' || opType === 'restore') {
      setOperationType(opType);
    }
  }, [location.search]);
  
  // Fetch operations when component mounts or filters change
  useEffect(() => {
    const loadOperations = async () => {
      try {
        setLoading(true);
        await fetchOperations(selectedConfig === 'all' ? undefined : selectedConfig);
        setError(null);
      } catch (err) {
        console.error('Error fetching operations:', err);
        setError('Failed to load operations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadOperations();
  }, [selectedConfig, fetchOperations]);
  
  // Filter operations based on selected filters
  const filteredOperations = operations.filter(op => {
    const matchesConfig = selectedConfig === 'all' || op.config_id === selectedConfig;
    const matchesType = operationType === 'all' || op.operation_type === operationType;
    const matchesStatus = statusFilter === 'all' || op.status === statusFilter;
    
    return matchesConfig && matchesType && matchesStatus;
  });
  
  // Handle operation execution
  const handleExecuteOperation = async (configId: number, type: OperationType) => {
    try {
      setIsExecuting(prev => ({ ...prev, [configId]: true }));
      
      if (type === 'dump') {
        await executeDump(configId);
      } else {
        const config = configs.find(c => c.id === configId);
        if (config) {
          await executeRestore(configId, config.dump_path);
        }
      }
      
      // Refresh operations after execution
      await fetchOperations(selectedConfig === 'all' ? undefined : selectedConfig);
    } catch (err) {
      console.error(`Error executing ${type}:`, err);
      setError(`Failed to execute ${type} operation`);
    } finally {
      setIsExecuting(prev => ({ ...prev, [configId]: false }));
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filter: 'config' | 'type' | 'status', value: any) => {
    const params = new URLSearchParams(location.search);
    
    switch (filter) {
      case 'config':
        setSelectedConfig(value);
        params.set('configId', value === 'all' ? '' : value.toString());
        break;
      case 'type':
        setOperationType(value);
        params.set('operation', value === 'all' ? '' : value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
    }
    
    navigate(`?${params.toString()}`, { replace: true });
  };
  
  // Get config name by ID
  const getConfigName = (configId: number): string => {
    const config = configs.find(c => c.id === configId);
    return config ? config.name : 'Unknown Config';
  };
  
  // Get status badge variant
  const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'started': return 'warning';
      default: return 'secondary';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string): React.ReactElement => {
    const iconProps = { size: 20, className: 'me-2' };
    
    switch (status) {
      case 'completed': return <CheckCircle {...iconProps} className="text-success" />;
      case 'failed': return <XCircle {...iconProps} className="text-danger" />;
      case 'started': return <Clock {...iconProps} className="text-warning" />;
      default: return <ClockCounterClockwise {...iconProps} className="text-secondary" />;
    }
  };
  
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
          <Button variant="link" onClick={() => window.location.reload()} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Operations</h2>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={() => window.location.reload()}
        >
          <ArrowClockwise size={16} className="me-1" />
          Refresh
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Header className="bg-light d-flex align-items-center">
          <Funnel size={20} className="me-2" />
          <span className="fw-bold">Filters</span>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group controlId="configFilter">
                <Form.Label>Configuration</Form.Label>
                <Form.Select 
                  value={selectedConfig}
                  onChange={(e) => handleFilterChange('config', e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                >
                  <option value="all">All Configurations</option>
                  {configs.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="typeFilter">
                <Form.Label>Operation Type</Form.Label>
                <Form.Select 
                  value={operationType}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="dump">Dump</option>
                  <option value="restore">Restore</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="statusFilter">
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="started">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body className="p-0">
          {filteredOperations.length === 0 ? (
            <div className="text-center p-5">
              <p className="text-muted">No operations found</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Operation</th>
                  <th>Configuration</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map(op => (
                  <tr key={op.id}>
                    <td>
                      <Badge 
                        bg={op.operation_type === 'dump' ? 'primary' : 'info'}
                        className="text-uppercase"
                      >
                        {op.operation_type}
                      </Badge>
                    </td>
                    <td>{getConfigName(op.config_id)}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {getStatusIcon(op.status)}
                        <Badge bg={getStatusVariant(op.status)} className="text-uppercase">
                          {op.status}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      {new Date(op.created_at).toLocaleString()}
                      <div className="text-muted small">
                        {formatDistanceToNow(new Date(op.created_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td>
                      {op.end_time && op.start_time 
                        ? `${Math.round((new Date(op.end_time).getTime() - new Date(op.start_time).getTime()) / 1000)}s`
                        : '-'}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleExecuteOperation(op.config_id, op.operation_type as OperationType)}
                          disabled={isExecuting[op.config_id]}
                        >
                          {isExecuting[op.config_id] ? (
                            <>
                              <Spinner as="span" size="sm" animation="border" role="status" className="me-1" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play size={16} className="me-1" />
                              Run Again
                            </>
                          )}
                        </Button>
                        {op.error_message && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => alert(`Error: ${op.error_message}`)}
                            title="View Error"
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Operations;
