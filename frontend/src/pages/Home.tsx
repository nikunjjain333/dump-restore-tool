import React from 'react';
import { Card, Button as BsButton, Container, Row, Col } from 'react-bootstrap';
import { Database, ClockCounterClockwise, Plus } from 'phosphor-react';
import { Link } from 'react-router-dom';

// Create a type-safe Button component that works with React Router's Link
const Button = BsButton as any;

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section py-5 bg-light mb-5">
        <Container>
          <h1 className="display-4 mb-4">Database Dump & Restore Tool</h1>
          <p className="lead">Easily manage database backups and restores with a simple, intuitive interface.</p>
          
          <div className="mt-4">
            <Button as={Link} to="/configs/new" variant="primary" size="lg" className="me-3">
              <Plus size={20} className="me-2" />
              Create New Config
            </Button>
            <Button as={Link} to="/configs" variant="outline-secondary" size="lg">
              View Configurations
            </Button>
          </div>
        </Container>
      </div>

      <Container>
        <h2 className="mb-4">Features</h2>
        
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div className="icon-wrapper mb-3">
                  <Database size={48} className="text-primary" />
                </div>
                <Card.Title>Multiple Database Support</Card.Title>
                <Card.Text>
                  Works with PostgreSQL and MySQL databases. More database support coming soon.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div className="icon-wrapper mb-3">
                  <ClockCounterClockwise size={48} className="text-success" />
                </div>
                <Card.Title>Save Configurations</Card.Title>
                <Card.Text>
                  Save your database configurations for quick access and reuse.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div className="icon-wrapper mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                <Card.Title>Track Operations</Card.Title>
                <Card.Text>
                  Keep track of all your dump and restore operations with detailed logs.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <div className="mt-5">
          <h3>Getting Started</h3>
          <ol className="lead">
            <li>Create a new database configuration</li>
            <li>Save your configuration for future use</li>
            <li>Execute dump or restore operations with a single click</li>
            <li>Monitor operation status in the Operations tab</li>
          </ol>
        </div>
      </Container>
    </div>
  );
};

export default Home;
