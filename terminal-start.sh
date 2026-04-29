#!/bin/bash
# terminal-start.sh — Start Xpra with HTML5 web client

# Clean up stale sockets/locks from previous runs
rm -rf /run/user/2029/xpra/* 2>/dev/null
rm -f /tmp/.X*-lock /tmp/.X11-unix/X* 2>/dev/null

echo "Starting Xpra web desktop on port 7681..."

exec xpra start \
  --bind-ws=0.0.0.0:7681 \
  --html=on \
  --no-daemon \
  --start=xfce4-terminal \
  --no-pulseaudio \
  --no-notifications \
  --no-mdns \
  --no-printing \
  --no-webcam \
  --no-clipboard \
  --dpi=96 \
  --sharing=yes \
  --exit-with-children=no \
  2>&1
