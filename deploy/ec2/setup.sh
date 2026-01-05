#!/bin/bash
# EC2 Initial Setup Script for Assets Management API
# Run this once on a fresh Ubuntu 22.04/24.04 EC2 instance
# Usage: chmod +x setup.sh && sudo ./setup.sh

set -e

echo "🚀 Setting up Assets Management API on EC2..."

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
corepack enable
corepack prepare pnpm@10.26.1 --activate

# Install build dependencies for native modules
echo "📦 Installing build dependencies..."
apt-get install -y python3 make g++ git

# Install runtime dependencies for media processing
echo "📦 Installing media processing dependencies..."
apt-get install -y libvips-dev ffmpeg

# Create app user
echo "👤 Creating app user..."
useradd -m -s /bin/bash appuser || true

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /opt/assets-api
chown appuser:appuser /opt/assets-api

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Configure PM2 to start on boot
pm2 startup systemd -u appuser --hp /home/appuser

# Create logs directory
mkdir -p /var/log/assets-api
chown appuser:appuser /var/log/assets-api

# Install nginx for reverse proxy (optional but recommended)
echo "📦 Installing Nginx..."
apt-get install -y nginx

# Create nginx config
cat > /etc/nginx/sites-available/assets-api << 'EOF'
server {
    listen 80;
    server_name _;

    # Increase max body size for file uploads
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/assets-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx
systemctl enable nginx

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/assets-api"
echo "2. Copy deploy/ec2/deploy.sh to the server"
echo "3. Create /opt/assets-api/.env with production values"
echo "4. Run ./deploy.sh to deploy the application"
echo ""
echo "For HTTPS, install Certbot:"
echo "  apt install certbot python3-certbot-nginx"
echo "  certbot --nginx -d your-domain.com"
