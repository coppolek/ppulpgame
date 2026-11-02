module.exports = {
  apps: [
    {
      name: 'puulp-web',
      script: './server.js',
      instances: 'max', // Scale to all available CPU cores on the VPS
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
    },
  ],
};
