#!/bin/bash

echo "Starting WebSocket server for real-time updates..."
echo "Make sure you have installed the required dependencies:"
echo "composer require cboden/ratchet"

# Check if composer dependencies are installed
if [ ! -d "vendor/cboden" ]; then
    echo "Installing Ratchet WebSocket library..."
    composer require cboden/ratchet
fi

# Start WebSocket server
echo "Starting WebSocket server on port 8090..."
php artisan websocket:serve
