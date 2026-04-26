#!/bin/bash
# GLM Sniper 部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

# === 配置 ===
PROJECT_DIR="/opt/glm-sniper"
FRONTEND_PORT=5001
BACKEND_PORT=5010
REPO_URL="https://github.com/16499259-oss/GLM-sniper.git"

echo "=========================================="
echo "  GLM Sniper 部署脚本"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo "=========================================="

# === 1. 检查 Node.js ===
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低 (当前: v$NODE_VERSION)，需要 18+"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"
echo "✓ npm 版本: $(npm -v)"

# === 2. 创建目录 ===
echo "创建项目目录..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR

# === 3. 克隆/更新项目 ===
if [ -d ".git" ]; then
    echo "更新现有项目..."
    git pull origin main
else
    echo "克隆项目..."
    git clone $REPO_URL .
fi

# === 4. 安装依赖 ===
echo "安装 npm 依赖..."
npm install

# === 5. 创建环境变量文件 ===
echo "创建环境变量..."
cat > .env.production << EOF
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
EOF

# === 6. 构建前端 ===
echo "构建前端应用..."
npm run build

# === 7. 安装 pm2 到项目本地（更可靠）===
echo "安装 PM2..."
npm install pm2 serve

# === 8. 创建 PM2 配置 ===
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [
    {
      name: 'glm-sniper-server',
      script: 'npx',
      args: 'tsx server/index.ts',
      cwd: '$PROJECT_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: $BACKEND_PORT
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
      args: 'serve -s dist -l $FRONTEND_PORT',
      cwd: '$PROJECT_DIR',
      watch: false,
      autorestart: true,
      time: true
    }
  ]
};
EOF

# === 9. 停止旧服务（如果存在） ===
echo "停止旧服务..."
npx pm2 delete glm-sniper-server 2>/dev/null || true
npx pm2 delete glm-sniper-front 2>/dev/null || true

# === 10. 启动服务 ===
echo "启动服务..."
npx pm2 start ecosystem.config.cjs

# === 11. 设置开机自启 ===
echo "设置开机自启..."
npx pm2 save
PM2_STARTUP=$(npx pm2 startup | grep "sudo" | head -1)
if [ -n "$PM2_STARTUP" ]; then
    eval "$PM2_STARTUP"
fi

# === 12. 验证 ===
sleep 3
echo ""
echo "=========================================="
echo "  ✓ 部署完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端: http://115.190.223.216:$FRONTEND_PORT"
echo "  后端健康检查: http://115.190.223.216:$BACKEND_PORT/api/health"
echo ""
echo "验证命令:"
curl -s http://localhost:$BACKEND_PORT/api/health && echo " ✓ 后端正常" || echo " ❌ 后端异常"
curl -s http://localhost:$FRONTEND_PORT > /dev/null && echo " ✓ 前端正常" || echo " ❌ 前端异常"
echo ""
echo "=========================================="
echo "常用管理命令:"
echo "=========================================="
echo "  npx pm2 status              # 查看服务状态"
echo "  npx pm2 logs                # 查看日志"
echo "  npx pm2 logs glm-sniper-server  # 查看后端日志"
echo "  npx pm2 restart all         # 重启所有服务"
echo "  npx pm2 restart glm-sniper-server  # 重启后端"
echo "  npx pm2 stop all            # 停止所有服务"
echo "  npx pm2 start all           # 启动所有服务"
echo "  npx pm2 monit               # 实时监控"
echo "=========================================="
echo ""
npx pm2 status