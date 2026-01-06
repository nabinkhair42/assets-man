#!/bin/bash

# EC2 Initial Setup Script for Assets API
# Run this once on a fresh EC2 instance (Amazon Linux 2023)
# Usage: curl -fsSL https://raw.githubusercontent.com/nabinkhair42/assets-man/master/scripts/setup-ec2.sh | bash

set -e

echo "🔧 Setting up EC2 instance for Assets API..."

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install pnpm and PM2 globally
echo "📦 Installing pnpm and PM2..."
sudo npm install -g pnpm pm2

# Clone repository
echo "📥 Cloning repository..."
cd /home/ec2-user
git clone https://github.com/nabinkhair42/assets-man.git
cd assets-man

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build API
echo "🔨 Building API..."
pnpm build:api

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create apps/api/.env file with your environment variables"
echo "2. Run: pm2 start 'pnpm start:api' --name assets-api"
echo "3. Run: pm2 save && pm2 startup"
echo ""
echo "Example .env file:"
echo "---"
cat << 'ENVEOF'
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
CLIENT_URL=https://your-frontend.com
STORAGE_PROVIDER=s3
STORAGE_BUCKET=your-bucket
STORAGE_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
ENVEOF
echo "---"
