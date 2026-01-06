#!/bin/bash

# Assets API Deployment Script
# Usage: bash scripts/deploy.sh (run from project root)

set -e

# Auto-detect project directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting deployment..."
echo "📁 Project directory: $PROJECT_DIR"

# Navigate to project directory
cd "$PROJECT_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build API
echo "🔨 Building API..."
pnpm build:api

# Restart PM2
echo "🔄 Restarting API server..."
if pm2 describe assets-api > /dev/null 2>&1; then
    pm2 restart assets-api
else
    echo "Starting new PM2 process..."
    pm2 start "pnpm start:api" --name assets-api --cwd "$PROJECT_DIR"
fi

# Save PM2 config
pm2 save

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "🔗 Health check:"
sleep 2
curl -s http://localhost:3001/health || echo "Health check failed - API may still be starting"
echo ""
