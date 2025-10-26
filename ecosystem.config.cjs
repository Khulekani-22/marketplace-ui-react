// PM2 ecosystem file for load balancing and process management
module.exports = {
  apps: [
    {
      name: 'sloane-backend',
      script: './backend/server.js',
      
      // Cluster mode - run multiple instances
      instances: process.env.PM2_INSTANCES || 'max', // 'max' = number of CPU cores
      exec_mode: 'cluster', // Enable load balancing across instances
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10, // Max restarts within min_uptime period
      min_uptime: '10s', // Minimum uptime before considered stable
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Watch mode (disabled in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'temp'],
      
      // Environment variables - Development
      env: {
        NODE_ENV: 'development',
        PORT: 5055,
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
      },
      
      // Environment variables - Production
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5055,
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      },
      
      // Environment variables - Staging
      env_staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || 5055,
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
      },
      
      // Logging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_rotate_size: '10M', // Rotate logs at 10MB
      log_rotate_interval: '1d', // Rotate logs daily
      
      // Advanced configuration
      kill_timeout: 5000, // Time to wait before force killing (5s)
      listen_timeout: 3000, // Time to wait for app to listen (3s)
      shutdown_with_message: false,
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Cron for restart (optional - restart at 3 AM daily)
      // cron_restart: '0 3 * * *',
      
      // Source map support for better error traces
      source_map_support: true,
    },
    
    // Additional app for development server (optional)
    {
      name: 'sloane-dev',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'temp'],
      env: {
        NODE_ENV: 'development',
        PORT: 5056, // Different port for dev
      },
      error_file: './logs/dev-error.log',
      out_file: './logs/dev-out.log',
      time: true,
    },
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/sloane-marketplace.git',
      path: '/var/www/sloane-marketplace',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-deploy-local': 'echo "Deploying to production..."',
    },
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/sloane-marketplace.git',
      path: '/var/www/sloane-marketplace-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env staging',
    },
  },
};

