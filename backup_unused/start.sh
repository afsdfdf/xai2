#!/bin/bash

echo "Starting XAI Finance Development Environment..."
echo ""

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo ""
echo "Starting Python API server in the background..."
# Start the API server in the background and save its PID
python api_server.py &
API_PID=$!

echo ""
echo "Waiting for API server to start..."
sleep 5

echo ""
echo "Starting Next.js app..."
npm run dev &
NEXT_PID=$!

# Function to handle script exit and cleanup
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $API_PID
    kill $NEXT_PID
    exit
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for any process to exit
wait

# Call cleanup explicitly if we get here
cleanup 