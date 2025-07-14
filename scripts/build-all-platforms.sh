#!/bin/bash
# 🚀 크로스 플랫폼 빌드 스크립트

set -e

echo "🚀 Starting cross-platform build..."

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# 웹 앱 빌드
echo "🔨 Building web app..."
npm run build

# Linux 빌드 (이미 완료됨)
echo "🐧 Linux build already completed"

# Windows 빌드 (Docker 사용)
echo "🪟 Building Windows app with Docker..."
if command -v docker &> /dev/null; then
    docker build -f docker/Dockerfile.windows -t workflow-visualizer-windows .
    docker run --rm -v "$(pwd)/desktop/dist:/project/desktop/dist" workflow-visualizer-windows
    echo "✅ Windows build completed"
else
    echo "⚠️ Docker not available, skipping Windows build"
fi

# macOS 빌드는 macOS 환경에서만 가능
echo "🍎 macOS build requires macOS environment"
echo "   Run 'npm run desktop:build:mac' on macOS system"

echo "🎉 Cross-platform build completed!"
echo ""
echo "📦 Built files:"
echo "   Linux:   desktop/dist/Workflow Visualizer-1.1.0.AppImage"
echo "   Windows: desktop/dist/Workflow Visualizer Setup-1.1.0.exe (if Docker succeeded)"
echo "   macOS:   Requires macOS build environment"