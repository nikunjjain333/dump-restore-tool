# Database Dump & Restore Tool

A comprehensive tool for database dump and restore operations with a modern web interface and backend API.

## Features

- **Docker Integration**: Check Docker daemon status from the UI
- **Docker Compose Management**: Add, manage, and operate Docker Compose configurations
- **Multiple Database Support**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
- **Dump & Restore Operations**: Perform both operations on any saved configuration
- **Configuration Management**: Save database configurations and perform operations directly from config cards
- **Microservice Architecture**: Support for running processes in specific paths
- **Modern UI**: React with TypeScript and SCSS
- **RESTful API**: FastAPI backend with SQLAlchemy

## Tech Stack

### Frontend
- React 18
- TypeScript
- SCSS
- React Hook Form
- Axios
- React Router DOM
- React Select

### Backend
- Python 3.11
- FastAPI
- SQLAlchemy
- PostgreSQL
- Docker SDK
- Pydantic

## Project Structure

```
dump-restore-tool/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI routers
│   │   ├── core/          # Database and core utilities
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── main.py        # FastAPI entry point
│   ├── Dockerfile
│   ├── Makefile           # Development commands
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── styles/        # SCSS styles
│   │   ├── api/           # API client
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── start.sh               # Quick start script
├── stop.sh                # Quick stop script
└── README.md
```

## Quick Start

### Prerequisites
- **Docker and Docker Compose** (required for containerized setup)
- **Node.js 18+** (for local development)
- **Python 3.11+** (for local development)
- **Git** (for cloning the repository)

### Option 1: Docker Compose Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dump-restore-tool
   ```

2. **Start all services**
   ```bash
   # Option 1: Use the startup script (recommended)
   ./start.sh
   
   # Option 2: Manual startup
   docker-compose up --build -d
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://localhost:8001
   - **API Documentation**: http://localhost:8001/docs

4. **Stop the application**
   ```bash
   # Option 1: Use the stop script
   ./stop.sh
   
   # Option 2: Manual stop
   docker-compose down
   ```

### Option 2: Local Development Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
make venv

# Install dependencies
make install

# Run database migrations
make migrate

# Start the backend server
make run
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### Backend Makefile Commands
```bash
# Development commands
make venv                    # Create Python virtual environment
make install                 # Install Python dependencies
make migrate                 # Apply all Alembic migrations
make make_migration msg="message"  # Create new migration
make run                     # Start FastAPI server with auto-reload
make test                    # Run backend tests
make lint                    # Run code linting
```

## Database Setup and Commands

### Database Migrations

The application uses Alembic for database migrations. Here are the key commands:

```bash
cd backend

# Apply all pending migrations
make migrate

# Create a new migration after model changes
make make_migration msg="Add new field to configs"

# View migration history
alembic history

# Downgrade to a specific migration
alembic downgrade <revision_id>

# Upgrade to latest migration
alembic upgrade head
```

### Database Reset

If you need to reset the database:

```bash
cd backend

# Drop and recreate database (PostgreSQL)
make reset_db

# Or manually:
# 1. Connect to PostgreSQL
psql -U postgres -h localhost

# 2. Drop and recreate database
DROP DATABASE IF EXISTS dump_restore;
CREATE DATABASE dump_restore;

# 3. Run migrations
make migrate
```

### Database Backup and Restore

#### Backup the application database:
```bash
# Backup PostgreSQL database
pg_dump -U postgres -h localhost dump_restore > backup.sql

# Restore PostgreSQL database
psql -U postgres -h localhost dump_restore < backup.sql
```

## Docker Commands

### Container Management
```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs for a specific service
docker-compose logs backend
docker-compose logs frontend

# Restart a specific service
docker-compose restart backend

# Rebuild and restart services
docker-compose up --build

# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v
```

### Docker Compose Operations

The application supports Docker Compose operations through the UI:

1. **Add Docker Compose Configuration**
   - Navigate to Docker Compose page
   - Click "Add Configuration"
   - Enter path relative to home directory (e.g., `/Documents/my-project`)
   - The system automatically converts to container path (`/home/Documents/my-project`)

2. **Common Operations**
   - **Launch Stack**: `docker-compose up -d`
   - **Stop Stack**: `docker-compose down`
   - **Restart Stack**: `docker-compose restart`
   - **View Status**: `docker-compose ps`
   - **View Logs**: `docker-compose logs`
   - **Rebuild Images**: `docker-compose build`

## API Documentation

### Base URL
```
http://localhost:8001
```

### Authentication
Currently, the API doesn't require authentication. In production, implement proper authentication.

### Key Endpoints

#### Health Check
```http
GET /health
```

#### Docker Operations
```http
GET /docker/status
```

#### Docker Compose Operations
```http
GET /docker-compose/
POST /docker-compose/
POST /docker-compose/{config_id}/operate
```

#### Configuration Management
```http
GET /configs
POST /configs
PUT /configs/{config_id}
DELETE /configs/{config_id}
```

#### Database Operations
```http
POST /dump
POST /restore
```

## Database Support

### PostgreSQL
**Parameters:**
- `host`: Database host (default: localhost)
- `port`: Database port (default: 5432)
- `database`: Database name (required)
- `username`: Username (required)
- `password`: Password (required)

**Dump Command:** `pg_dump`
**Restore Command:** `psql`

### MySQL
**Parameters:**
- `host`: Database host (default: localhost)
- `port`: Database port (default: 3306)
- `database`: Database name (required)
- `username`: Username (required)
- `password`: Password (required)

**Dump Command:** `mysqldump`
**Restore Command:** `mysql`

### MongoDB
**Parameters:**
- `uri`: Connection URI (required)
- `database`: Database name (required)

**Dump Command:** `mongodump`
**Restore Command:** `mongorestore`

### Redis
**Parameters:**
- `host`: Redis host (default: localhost)
- `port`: Redis port (default: 6379)
- `password`: Password (optional)
- `db`: Database number (default: 0)

**Dump Command:** `redis-cli --rdb`
**Restore Command:** Copy RDB file

### SQLite
**Parameters:**
- `database`: Database file path (required)

**Dump Command:** Copy database file
**Restore Command:** Copy database file

## Environment Variables

### Backend
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/dump_restore

# API
API_HOST=0.0.0.0
API_PORT=8001

# Docker
DOCKER_HOST=unix:///var/run/docker.sock

# Logging
LOG_LEVEL=INFO
```

### Frontend
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8001

# Development Configuration
REACT_APP_ENV=development
```

## Troubleshooting

### Common Issues

1. **Docker not accessible**
   ```bash
   # Check Docker daemon status
   docker info
   
   # Start Docker Desktop (macOS/Windows)
   # Or start Docker service (Linux)
   sudo systemctl start docker
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose logs db
   
   # Restart database service
   docker-compose restart db
   ```

3. **Port conflicts**
   ```bash
   # Check what's using port 3001 or 8001
   lsof -i :3001
   lsof -i :8001
   
   # Kill process if needed
   kill -9 <PID>
   ```

4. **Permission issues with Docker**
   ```bash
   # Add user to docker group (Linux)
   sudo usermod -aG docker $USER
   
   # Logout and login again
   ```

### Development Issues

1. **Frontend build errors**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm start
   ```

2. **Backend import errors**
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Database migration issues**
   ```bash
   cd backend
   make migrate
   # If that fails, try:
   alembic upgrade head
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
