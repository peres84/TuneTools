#!/bin/bash

# TuneTools Backend Startup Script (Linux/Mac)
# This script starts the FastAPI backend server

echo "=========================================="
echo "  TuneTools Backend - Starting Server"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    echo "⚠️  Warning: Virtual environment not found."
    echo "Creating virtual environment..."
    python3 -m venv .venv
    echo "✅ Virtual environment created."
fi

# Activate virtual environment
if [ -d ".venv" ]; then
    echo "🔧 Activating virtual environment (.venv)..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "🔧 Activating virtual environment (venv)..."
    source venv/bin/activate
fi

# Check if requirements are installed
echo "📦 Checking dependencies..."
pip install -q -r requirements.txt

# Get port from environment or use default
PORT=${PORT:-8000}

echo ""
echo "✅ Starting TuneTools backend on port $PORT..."
echo "📍 API Documentation: http://localhost:$PORT/docs"
echo "📍 Health Check: http://localhost:$PORT/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="

# Start the server
uvicorn main:app --host 0.0.0.0 --port $PORT --reload
