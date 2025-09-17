<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WebSocket Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for WebSocket server settings
    | used for real-time updates in the application.
    |
    */

    'host' => env('WEBSOCKET_HOST', '0.0.0.0'),
    'port' => env('WEBSOCKET_PORT', 8090),
    'max_connections' => env('WEBSOCKET_MAX_CONNECTIONS', 1000),
    'heartbeat_interval' => env('WEBSOCKET_HEARTBEAT_INTERVAL', 30),
    'reconnect_attempts' => env('WEBSOCKET_RECONNECT_ATTEMPTS', 5),
    'reconnect_interval' => env('WEBSOCKET_RECONNECT_INTERVAL', 3000),
];
