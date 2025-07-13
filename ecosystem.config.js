module.exports = {
  apps: [
    {
      name: 'workflow-visualizer',
      script: './server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.production',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '2G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // 프로덕션 환경 최적화 설정
      node_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size'
      ],
      
      // 헬스 체크 설정
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // 클러스터 모드 설정
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // 로그 로테이션 설정
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 환경별 설정
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        instances: 0  // CPU 코어 수만큼 자동 설정
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        instances: 1
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/workflow-visualizer.git',
      path: '/var/www/workflow-visualizer',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'deploy',
      host: 'your-staging-server-ip',
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/workflow-visualizer.git',
      path: '/var/www/workflow-visualizer-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};