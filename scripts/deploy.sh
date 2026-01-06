#!/bin/bash

# Assets API Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /home/ec2-user/assets-man

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build API
echo "🔨 Building API..."
pnpm build:api

# Restart PM2
echo "🔄 Restarting API server..."
pm2 restart assets-api || pm2 start "pnpm start:api" --name assets-api

# Save PM2 config
pm2 save

echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "🔗 Health check:"
curl -s http://localhost:3001/health | head -c 200
echo ""
