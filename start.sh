#!/bin/bash

# 我的照片集 - 启动脚本

echo "📸 我的照片集 - 个人照片收集网站"
echo "================================"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 设置默认端口
PORT=${PORT:-3000}

echo ""
echo "🚀 正在启动服务器..."
echo "📍 访问地址: http://localhost:$PORT"
echo "💡 按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
PORT=$PORT node server.js
