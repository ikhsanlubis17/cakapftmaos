<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Illuminate\Support\Facades\Log;

class WebSocketServer extends Command
{
    protected $signature = 'websocket:serve';
    protected $description = 'Start WebSocket server for real-time updates';

    public function handle()
    {
        $this->info('Starting WebSocket server...');
        
        $server = IoServer::factory(
            new HttpServer(
                new WsServer(
                    new class implements MessageComponentInterface {
                        protected $clients;

                        public function __construct()
                        {
                            $this->clients = new \SplObjectStorage;
                        }

                        public function onOpen(ConnectionInterface $conn)
                        {
                            $this->clients->attach($conn);
                            Log::info("New WebSocket connection: {$conn->resourceId}");
                        }

                        public function onMessage(ConnectionInterface $from, $msg)
                        {
                            $data = json_decode($msg, true);
                            
                            if (isset($data['type']) && $data['type'] === 'subscribe') {
                                $from->userId = $data['user_id'] ?? null;
                                $from->userRole = $data['user_role'] ?? null;
                                Log::info("User {$data['user_id']} subscribed to WebSocket");
                            }
                        }

                        public function onClose(ConnectionInterface $conn)
                        {
                            $this->clients->detach($conn);
                            Log::info("WebSocket connection closed: {$conn->resourceId}");
                        }

                        public function onError(ConnectionInterface $conn, \Exception $e)
                        {
                            Log::error("WebSocket error: {$e->getMessage()}");
                            $conn->close();
                        }

                        public function broadcastToUser($userId, $data)
                        {
                            foreach ($this->clients as $client) {
                                if (isset($client->userId) && $client->userId == $userId) {
                                    $client->send(json_encode($data));
                                }
                            }
                        }

                        public function broadcastToRole($role, $data)
                        {
                            foreach ($this->clients as $client) {
                                if (isset($client->userRole) && $client->userRole == $role) {
                                    $client->send(json_encode($data));
                                }
                            }
                        }
                    }
                )
            ),
            8090
        );

        $this->info('WebSocket server started on port 8090');
        $server->run();
    }
}
