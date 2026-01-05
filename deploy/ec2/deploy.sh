#!/bin/bash
# Deployment Script for Assets Management API
# Run this to deploy or update the application
# Usage: ./deploy.sh

set -e

APP_DIR="/opt/assets-api"
REPO_URL="${REPO_URL:-https://github.com/nabinkhair42/assets-man.git}"
BRANCH="${BRANCH:-main}"

echo "🚀 Deploying Assets Management API..."

cd $APP_DIR

# Pull latest code or clone if first deployment
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "📥 Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build the application
echo "🔨 Building application..."
pnpm turbo build --filter=api

# Run database migrations
echo "🗄️ Running database migrations..."
pnpm db:push

# Restart the application with PM2
echo "🔄 Restarting application..."
if pm2 describe assets-api > /dev/null 2>&1; then
    pm2 reload assets-api
else
    pm2 start apps/api/dist/index.js \
        --name assets-api \
        --cwd $APP_DIR \
        --log /var/log/assets-api/app.log \
        --time \
        --env production
    pm2 save
fi

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
pm2 status assets-api
echo ""
echo "View logs: pm2 logs assets-api"
