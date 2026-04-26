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
      time: true
    },
    {
      name: 'glm-sniper-front',
      script: 'npx',
      args: 'serve -s dist -l 5001',
      cwd: '/opt/glm-sniper',
      watch: false,
      autorestart: true,
      time: true
    }
  ]
};