# Database Dump & Restore Tool

A comprehensive tool for database dump and restore operations with a modern web interface and backend API.

## Features

- **Docker Integration**: Start Docker daemon from the UI
- **Docker Compose Management**: Add, manage, and operate Docker Compose configurations
- **Multiple Database Support**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
- **Dump & Restore Operations**: Separate logic for each operation
- **Configuration Management**: Save and reuse configurations
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
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

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

**Start Docker Daemon**
```http
POST /docker/start
```
**Request Body:**
```json
{
  "force": false
}
```
**Response:**
```json
{
  "success": true,
  "message": "Docker daemon started successfully",
  "status": "started"
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
    "operation": "dump",
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
  "operation": "dump",
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

## Implementation Details

### Backend Services

#### Docker Service
- Manages Docker daemon startup
- Provides Docker client connections
- Handles Docker container operations

#### Dump Service
- Supports all database types
- Uses Docker containers for database tools
- Handles file path management
- Provides detailed error reporting

#### Restore Service
- Supports all database types
- Validates restore file existence
- Uses Docker containers for database tools
- Provides detailed error reporting

#### Configuration Service
- Manages saved configurations
- Handles database CRUD operations
- Provides validation and error handling

### Frontend Components

#### DockerButton
- Starts Docker daemon
- Shows loading state
- Handles errors gracefully

#### DatabaseTypeSelector
- Dropdown for database selection
- Supports all database types
- Form validation integration

#### OperationSelector
- Radio buttons for dump/restore
- Form validation integration
- Clear visual feedback

#### DynamicFormFields
- Renders database-specific fields
- Form validation
- Default values for common settings

#### ConfigNameInput
- Configuration naming
- Validation (min length, uniqueness)
- Error display

#### PathInput
- File path input
- Path validation
- Error display

#### SavedConfigsList
- Displays saved configurations
- Click to load configuration
- Card-based layout

#### StartProcessButton
- Starts dump/restore operations
- Loading state management
- Disabled state handling

## Error Handling

### Backend
- Comprehensive exception handling
- Detailed error messages
- HTTP status codes
- Logging for debugging

### Frontend
- API error handling
- Form validation errors
- User-friendly error messages
- Loading states

## Security Considerations

1. **Environment Variables**: Store sensitive data in environment variables
2. **Input Validation**: All inputs are validated using Pydantic
3. **SQL Injection**: Using SQLAlchemy ORM prevents SQL injection
4. **File Path Validation**: Paths are validated to prevent directory traversal
5. **Docker Security**: Containers run with minimal privileges

## Production Deployment

### Docker Compose
```bash
# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
Set all required environment variables in production:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export SECRET_KEY="your-secure-secret-key"
export LOG_LEVEL="WARNING"
```

### Reverse Proxy
Use Nginx or similar for:
- SSL termination
- Rate limiting
- Static file serving

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
