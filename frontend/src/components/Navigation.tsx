import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import {
  Database,
  Gear,
  PlusCircle,
  ClockCounterClockwise,
} from "phosphor-react";

interface NavigationProps {}

const Navigation: React.FC<NavigationProps> = () => {
  const location = useLocation();

  const isActive = (path: string): string => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <Database size={24} className="me-2" weight="duotone" />
          <span>DB Dump & Restore</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/configs"
              className={`d-flex align-items-center ${isActive("/configs")}`}
            >
              <Gear size={20} className="me-1" weight="duotone" />
              <span>Configurations</span>
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/operations"
              className={`d-flex align-items-center ${isActive("/operations")}`}
            >
              <ClockCounterClockwise
                size={20}
                className="me-1"
                weight="duotone"
              />
              <span>Operations</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
