<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Models\Notification;
use App\Models\Apar;
use App\Models\User;

class NotificationController extends Controller
{


    /**
     * Send email notification
     */
    public function sendEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'subject' => 'required|string',
            'message' => 'required|string',
            'type' => 'required|in:inspection_reminder,refill_reminder,expiry_reminder'
        ]);

        try {
            // Send email using Laravel Mail
            Mail::raw($request->message, function ($message) use ($request) {
                $message->to($request->email)
                        ->subject($request->subject);
            });

            // Log notification
            Notification::create([
                'user_id' => Auth::id(),
                'type' => $request->type,
                'channel' => 'email',
                'recipient' => $request->email,
                'message' => $request->message,
                'status' => 'sent'
            ]);

            return response()->json([
                'message' => 'Email berhasil dikirim',
                'status' => 'success'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
                'status' => 'error'
            ], 500);
        }
    }

    /**
     * Get notification history
     */
    public function index(Request $request)
    {
        $query = Notification::with('user');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }

        $notifications = $query->orderBy('created_at', 'desc')
                              ->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Send bulk notifications for scheduled inspections (today only)
     */
    public function sendBulkNotifications()
    {
        try {
            $notificationService = new \App\Services\NotificationService();
            $sentCount = $notificationService->sendBulkInspectionReminders();

            return response()->json([
                'message' => "Berhasil mengirim {$sentCount} notifikasi untuk jadwal hari ini",
                'sent_count' => $sentCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
                'status' => 'error'
            ], 500);
        }
    }

    /**
     * Send bulk notifications for all active schedules
     */
    public function sendBulkNotificationsAll()
    {
        try {
            $notificationService = new \App\Services\NotificationService();
            $sentCount = $notificationService->sendBulkInspectionRemindersAll();

            return response()->json([
                'message' => "Berhasil mengirim {$sentCount} notifikasi untuk semua jadwal aktif",
                'sent_count' => $sentCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
                'status' => 'error'
            ], 500);
        }
    }
} 