#!/bin/bash
# GLM Sniper 一键启动脚本

echo "🚀 正在启动 GLM Sniper..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 检查端口占用
echo "📋 检查端口占用..."
if lsof -i :5173 > /dev/null 2>&1; then
    echo "⚠️  端口 5173 已被占用，前端可能已运行"
fi
if lsof -i :3100 > /dev/null 2>&1; then
    echo "⚠️  端口 3100 已被占用，后端可能已运行"
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

# 启动后端服务（后台运行）
echo "🔧 启动后端服务 (端口 3100)..."
npm run server &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端开发服务器
echo "🌐 启动前端服务 (端口 5173)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🎯 GLM Sniper 已启动！"
echo "  🌐 前端地址: http://localhost:5173"
echo "  🔧 后端地址: http://localhost:3100"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 等待任意进程退出
wait
