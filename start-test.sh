#!/bin/bash

# Construction Quality Pulse - Quick Start Test Script
# This script helps you verify the Firebase integration

set -e

echo "=================================================="
echo "  Construction Quality Pulse - Quick Start"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "Please create .env.local with your Firebase credentials"
    exit 1
fi

# Check if Firebase is enabled
if ! grep -q "NEXT_PUBLIC_FIREBASE_ENABLED=true" .env.local; then
    echo "❌ Error: NEXT_PUBLIC_FIREBASE_ENABLED is not set to true"
    echo "Please set NEXT_PUBLIC_FIREBASE_ENABLED=true in .env.local"
    exit 1
fi

# Check if Firebase API key is configured
if ! grep -q "NEXT_PUBLIC_FIREBASE_API_KEY=AIza" .env.local; then
    echo "❌ Error: Firebase API key is not configured"
    echo "Please set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local"
    exit 1
fi

echo "✅ Configuration check passed"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting services..."
echo ""

# Check if ports are available
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Warning: Port 5000 is already in use"
    echo "   Please stop any process using port 5000"
    exit 1
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Warning: Port 3000 is already in use"
    echo "   Please stop any process using port 3000"
    exit 1
fi

# Create log directory
mkdir -p logs

echo "Starting backend server..."
npm run dev:backend > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "Starting frontend..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "=================================================="
echo "  ✅ Services are running!"
echo "=================================================="
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Backend logs:  tail -f logs/backend.log"
echo "Frontend logs: tail -f logs/frontend.log"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000/bootstrap-admin in your browser"
echo "  2. Create the first admin account"
echo "  3. Login at http://localhost:3000/login"
echo ""
echo "To stop the services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or press Ctrl+C and then run:"
echo "  pkill -f 'node server/index.js'"
echo "  pkill -f 'next dev'"
echo ""

# Save PIDs for cleanup
echo "$BACKEND_PID" > logs/backend.pid
echo "$FRONTEND_PID" > logs/frontend.pid

echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Services stopped'; exit 0" INT TERM

# Keep script running
wait
