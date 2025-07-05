# Database Dump & Restore Tool

A web-based tool for managing database dumps and restores with an intuitive UI. This application supports PostgreSQL and MySQL databases, allowing you to easily create backups and restore them when needed.

## Features

- **Multiple Database Support**: Works with PostgreSQL and MySQL databases
- **Save Configurations**: Save your database connection settings for future use
- **Dump & Restore**: Easily create database dumps and restore them
- **Operation History**: Track all your dump and restore operations
- **User-Friendly Interface**: Clean and intuitive web interface
- **Docker Support**: Easy deployment using Docker and Docker Compose

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js (v14 or later) and npm for frontend development (optional)
- Python (v3.8 or later) for backend development (optional)

## Getting Started

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/database-dump-restore.git
   cd database-dump-restore
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - PostgreSQL Database: localhost:5432

### Manual Setup (Development)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. The frontend will be available at http://localhost:3000

## Usage

1. **Create a New Configuration**
   - Click on "New Configuration"
   - Fill in your database connection details
   - Choose between Dump or Restore operation
   - Save the configuration

2. **Execute Operations**
   - From the Configurations page, click on the "Dump" or "Restore" button
   - Monitor the operation status in the Operations tab

3. **View History**
   - Navigate to the Operations page to view all past operations
   - Filter by configuration, operation type, or status

## Project Structure

```
.
├── backend/                 # Backend application
│   ├── app/                # Application source code
│   │   ├── __init__.py     # Application initialization
│   │   ├── main.py         # FastAPI application
│   │   ├── database.py     # Database configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic models
│   │   └── services/       # Business logic
│   ├── migrations/         # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Docker configuration
│
├── frontend/               # Frontend application
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # Global styles
│   │   ├── App.tsx         # Main component
│   │   └── index.tsx       # Entry point
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Docker configuration
│
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## Environment Variables

### Backend

Create a `.env` file in the `backend` directory with the following variables:

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/dump_restore
SECRET_KEY=your-secret-key
DEBUG=True
```

### Frontend

Create a `.env` file in the `frontend` directory with the following variables:

```
REACT_APP_API_URL=http://localhost:8000
```

## API Documentation

Once the backend server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Backend

- Run tests:
  ```bash
  cd backend
  pytest
  ```

- Generate migration:
  ```bash
  cd backend
  alembic revision --autogenerate -m "Your migration message"
  ```

### Frontend

- Run tests:
  ```bash
  cd frontend
  npm test
  ```

- Build for production:
  ```bash
  cd frontend
  npm run build
  ```

## Deployment

### Production

1. Build and start the production containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. The application will be available at http://your-server-ip

### Environment Variables for Production

For production, make sure to set the following environment variables in your production environment:

```
# Backend
DATABASE_URL=postgresql://username:password@db:5432/dbname
SECRET_KEY=your-secure-secret-key
DEBUG=False

# Frontend
REACT_APP_API_URL=https://your-api-domain.com
```

## Security Considerations

- Always use strong, unique passwords for database connections
- Keep your `.env` files secure and never commit them to version control
- Use HTTPS in production
- Regularly update your dependencies
- Implement proper authentication and authorization for production use

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
