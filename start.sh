#!/bin/bash

echo "🚀 Starting Database Dump & Restore Tool..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start the services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Application is starting up!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8001"
echo "📚 API Documentation: http://localhost:8001/docs"
echo ""
echo "💡 To view logs: docker-compose logs -f"
echo "💡 To stop: docker-compose down" 