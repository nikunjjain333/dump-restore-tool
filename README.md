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
└── README.md
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker Compose (Recommended)

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
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
# Create virtual environment (if not already created)
make venv
# Install dependencies
make install
# Run database migrations
make migrate
# (Optional) Create a new migration after model changes
make make_migration msg="your message here"
# Start the backend server
make run
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

#### Backend Makefile Commands
- `make venv` — Create a Python virtual environment in backend/
- `make install` — Install Python dependencies
- `make migrate` — Apply all Alembic migrations
- `make make_migration msg="message"` — Create a new Alembic migration (autogenerate)
- `make run` — Start the FastAPI backend with Uvicorn (auto-reload)

## API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication
Currently, the API doesn't require authentication. In production, implement proper authentication.

### Endpoints

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

#### Docker Operations

**Check Docker Status**
```http
GET /docker/status
```
**Response:**
```json
{
  "success": true,
  "message": "Docker daemon is running",
  "status": "running",
  "info": {
    "containers": 5,
    "images": 12,
    "version": "24.0.5",
    "os": "linux",
    "architecture": "x86_64"
  }
}
```

#### Docker Compose Operations

**List Docker Compose Configurations**
```http
GET /docker-compose/
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "My App Stack",
    "path": "/path/to/docker-compose.yml",
    "service_name": "web",
    "flags": {
      "detach": true,
      "build": false
    },
    "description": "Production web application stack",
    "is_active": true
  }
]
```

**Create Docker Compose Configuration**
```http
POST /docker-compose/
```
**Request Body:**
```json
{
  "name": "My App Stack",
  "path": "/path/to/docker-compose.yml",
  "service_name": "web",
  "flags": {
    "detach": true,
    "build": false
  },
  "description": "Production web application stack"
}
```

**Perform Docker Compose Operation**
```http
POST /docker-compose/{config_id}/operate
```
**Request Body:**
```json
{
  "config_id": 1,
  "operation": "up",
  "service_name": "web",
  "flags": {
    "detach": true,
    "build": true
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "Docker Compose up completed successfully",
  "output": "Starting myapp_web_1 ... done"
}
```

#### Configuration Management

**List Configurations**
```http
GET /configs
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Production PostgreSQL",
    "db_type": "postgres",
    "params": {
      "host": "localhost",
      "port": 5432,
      "database": "myapp",
      "username": "postgres",
      "password": "password"
    }
  }
]
```

**Create Configuration**
```http
POST /configs
```
**Request Body:**
```json
{
  "name": "Production PostgreSQL",
  "db_type": "postgres",
  "params": {
    "host": "localhost",
    "port": 5432,
    "database": "myapp",
    "username": "postgres",
    "password": "password"
  }
}
```

#### Database Operations

**Start Dump Operation**
```http
POST /dump
```
**Request Body:**
```json
{
  "db_type": "postgres",
  "params": {
    "host": "localhost",
    "port": 5432,
    "database": "myapp",
    "username": "postgres",
    "password": "password"
  },
  "path": "/tmp/dumps/myapp_backup.sql",
  "run_path": "/app"
}
```
**Response:**
```json
{
  "success": true,
  "message": "PostgreSQL dump completed successfully: /tmp/dumps/myapp_backup.sql",
  "path": "/tmp/dumps/myapp_backup.sql"
}
```

> **Note:** The backend will attempt to write the dump file to the path you specify. If the path is not writable due to file system restrictions, the backend will suggest alternative writable paths (such as `/tmp`, `~/Downloads`, or `~/Desktop`). There is no download endpoint; you should use a writable path accessible from your host system.

**Start Restore Operation**
```http
POST /restore
```
**Request Body:**
```json
{
  "db_type": "postgres",
  "params": {
    "host": "localhost",
    "port": 5432,
    "database": "myapp",
    "username": "postgres",
    "password": "password"
  },
  "path": "/tmp/dumps/myapp_backup.sql",
  "run_path": "/app"
}
```
**Response:**
```json
{
  "success": true,
  "message": "PostgreSQL restore completed successfully from: /tmp/dumps/myapp_backup.sql",
  "path": "/tmp/dumps/myapp_backup.sql"
}
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
API_PORT=8000

# Docker
DOCKER_HOST=unix:///var/run/docker.sock

# Logging
LOG_LEVEL=INFO

# Security
SECRET_KEY=your-secret-key-change-in-production

# File paths
DUMP_BASE_PATH=/tmp/dumps
RESTORE_BASE_PATH=/tmp/restores
```

### Frontend
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Development Configuration
REACT_APP_ENV=development
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
