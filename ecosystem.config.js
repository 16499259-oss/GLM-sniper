module.exports = {
  apps: [
    {
      name: 'glm-sniper-server',
      script: 'npx',
      args: 'tsx server/index.ts',
      cwd: '/opt/glm-sniper',
      env: {
        NODE_ENV: 'production',
        PORT: 5010
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      error_file: '/opt/glm-sniper/logs/server-error.log',
      out_file: '/opt/glm-sniper/logs/server-out.log',
      log_file: '/opt/glm-sniper/logs/server-combined.log',
      time: true
    },
    {
      name: 'glm-sniper-front',
      script: 'serve',
      args: '-s dist -l 5001',
      cwd: '/opt/glm-sniper',
      watch: false,
      autorestart: true,
      error_file: '/opt/glm-sniper/logs/front-error.log',
      out_file: '/opt/glm-sniper/logs/front-out.log',
      time: true
    }
  ]
};