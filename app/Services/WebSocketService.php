<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Pusher\Pusher;

class WebSocketService
{
    protected $pusher;

    public function __construct()
    {
        $this->pusher = new Pusher(
            config('broadcasting.connections.pusher.key'),
            config('broadcasting.connections.pusher.secret'),
            config('broadcasting.connections.pusher.app_id'),
            config('broadcasting.connections.pusher.options')
        );
    }

    /**
     * Broadcast repair approval status change to specific user
     */
    public function broadcastRepairApprovalStatusChange($repairApproval, $action)
    {
        try {
            $technician = $repairApproval->inspection->user;
            $apar = $repairApproval->inspection->apar;
            $admin = $repairApproval->approver;

            $data = [
                'type' => 'repair_approval_status_change',
                'action' => $action,
                'repair_approval_id' => $repairApproval->id,
                'user_id' => $technician->id,
                'apar_serial' => $apar->serial_number,
                'status' => $repairApproval->status,
                'admin_notes' => $repairApproval->admin_notes,
                'timestamp' => now()->toISOString(),
                'message' => $this->getStatusChangeMessage($action, $apar, $repairApproval, $admin)
            ];

            // Send to Pusher channel
            $this->sendToPusher("user.{$technician->id}", 'repair-approval-status-change', $data);

            Log::info("WebSocket broadcast sent for repair approval status change", [
                'repair_approval_id' => $repairApproval->id,
                'action' => $action,
                'user_id' => $technician->id
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to broadcast WebSocket message: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Broadcast to all admin users
     */
    public function broadcastToAdmins($data)
    {
        try {
            $adminData = array_merge($data, [
                'type' => 'admin_notification',
                'timestamp' => now()->toISOString()
            ]);

            $this->sendToPusher('admin-notifications', 'admin-notification', $adminData);

            Log::info("WebSocket broadcast sent to admins", $adminData);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to broadcast to admins: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send data via Pusher
     */
    protected function sendToPusher($channel, $event, $data)
    {
        try {
            $this->pusher->trigger($channel, $event, $data);
            
            Log::info("Pusher message sent successfully", [
                'channel' => $channel,
                'event' => $event,
                'data' => $data
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send Pusher message: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get status change message
     */
    protected function getStatusChangeMessage($action, $apar, $repairApproval, $admin)
    {
        $adminName = $admin ? $admin->name : 'Administrator';
        
        switch ($action) {
            case 'approved':
                return "Permintaan perbaikan APAR {$apar->serial_number} telah disetujui oleh {$adminName}";
            
            case 'rejected':
                return "Permintaan perbaikan APAR {$apar->serial_number} telah ditolak oleh {$adminName}";
            
            case 'completed':
                return "Perbaikan APAR {$apar->serial_number} telah selesai";
            
            default:
                return "Status perbaikan APAR {$apar->serial_number} telah berubah";
        }
    }
}
