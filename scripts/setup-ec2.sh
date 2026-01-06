#!/bin/bash

# EC2 Initial Setup Script for Assets API
# Works on Ubuntu and Amazon Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/nabinkhair42/assets-man/master/scripts/setup-ec2.sh | bash

set -e

echo "🔧 Setting up EC2 instance for Assets API..."

# Detect OS and set package manager
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS=$(uname -s)
fi

echo "📦 Detected OS: $OS"

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs git
elif [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs git
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

# Install pnpm and PM2 globally
echo "📦 Installing pnpm and PM2..."
sudo npm install -g pnpm pm2

# Get home directory
HOME_DIR=$(eval echo ~$USER)
PROJECT_DIR="$HOME_DIR/assets-man"

# Clone repository
echo "📥 Cloning repository..."
cd "$HOME_DIR"
if [ -d "assets-man" ]; then
    echo "📁 Repository already exists, pulling latest..."
    cd assets-man
    git pull origin master
else
    git clone https://github.com/nabinkhair42/assets-man.git
    cd assets-man
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build API
echo "🔨 Building API..."
pnpm build:api

# Make deploy script executable
chmod +x scripts/deploy.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create apps/api/.env file with your environment variables:"
echo ""
echo "   nano $PROJECT_DIR/apps/api/.env"
echo ""
echo "2. Add these variables:"
cat << 'ENVEOF'
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
CLIENT_URL=https://your-frontend-domain.com
STORAGE_PROVIDER=s3
STORAGE_BUCKET=your-bucket
STORAGE_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
ENVEOF
echo ""
echo "3. Start the API:"
echo "   cd $PROJECT_DIR"
echo "   pm2 start 'pnpm start:api' --name assets-api"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. For future deployments, run:"
echo "   $PROJECT_DIR/scripts/deploy.sh"
echo ""
