#!/bin/bash

echo "🛑 Stopping Database Dump & Restore Tool..."

docker-compose down

echo "🔍 Checking service status..."
docker-compose ps

echo "✅ All services stopped!" 