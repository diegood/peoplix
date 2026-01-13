module.exports = {
  apps: [
    {
      name: 'back-es',
      script: "./index.js",
      cwd: '/var/www/peoplix-es/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'DD-MM-YYYY HH:mm:ss Z',
      out_file: '/var/logs/peoplix/backend-out.log',
      error_file: '/var/logs/peoplix/backend-error.log',
      combine_logs: true,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info', // info, debug, warn, error
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
    },
    {
      name: 'back-eu',
      script: "./index.js",
      cwd: '/var/www/peoplix-eu/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'debug',
        PORT: 3001,
        ENV_FILE: '.env.production-eu',
      },
      env_file: '.env.production-eu',
      log_date_format: 'DD-MM-YYYY HH:mm:ss Z',
      out_file: '/var/logs/peoplix/backend-eu-out.log',
      error_file: '/var/logs/peoplix/backend-eu-error.log',
      combine_logs: true,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'debug', // info, debug, warn, error
        PORT: 3001,
        ENV_FILE: '.env.production-eu',
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
    },
  ],
  module_conf: {
    max_size: '10M',
    max_files: 10,
    compress: true,
    dateFormat: 'DD-MM-YYYY_HH-mm-ss',
  },
}
