#!/bin/bash
# Quick launcher for Mac/Linux

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Medical Device Lead Generator - Web App Launcher     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting web app..."
echo ""
echo "   Opening browser at: http://localhost:3000"
echo ""

# Try to open browser
if command -v open &> /dev/null; then
    sleep 2 && open http://localhost:3000 &
elif command -v xdg-open &> /dev/null; then
    sleep 2 && xdg-open http://localhost:3000 &
fi

# Start the webapp
npm run webapp
