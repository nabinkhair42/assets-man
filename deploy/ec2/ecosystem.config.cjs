// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "assets-api",
      script: "./apps/api/dist/index.js",
      cwd: "/opt/assets-api",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Logging
      log_file: "/var/log/assets-api/combined.log",
      out_file: "/var/log/assets-api/out.log",
      error_file: "/var/log/assets-api/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart policies
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",
      // Watch (disable in production)
      watch: false,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
