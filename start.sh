#!/bin/sh
# Start Python LDI backend in background
echo "[frontImage] Starting Python LDI backend on port 8100..."
cd /app/python
python3 server.py &
PYTHON_PID=$!

# Give Python a moment to bind
sleep 2

# Start Node.js Next.js server in foreground
echo "[frontImage] Starting Next.js on port 3000..."
cd /app
node server.js &
NODE_PID=$!

# Trap shutdown signals
trap "kill $PYTHON_PID $NODE_PID 2>/dev/null; exit 0" TERM INT

# Monitor both processes — exit if either dies
while kill -0 $PYTHON_PID 2>/dev/null && kill -0 $NODE_PID 2>/dev/null; do
  sleep 5
done

echo "[frontImage] A process exited, shutting down..."
kill $PYTHON_PID $NODE_PID 2>/dev/null
exit 1
