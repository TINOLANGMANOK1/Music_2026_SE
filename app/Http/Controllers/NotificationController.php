<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        // Only allow Admins and Music Deans to access notifications
        if (!in_array($request->user()->role, ['Administrator', 'Music Dean'])) {
            return response()->json([], 403);
        }

        $notifications = DB::table('notifications')
            ->where('notifiable_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($notification) {
                // Parse the JSON data field
                if (is_string($notification->data)) {
                    $notification->data = json_decode($notification->data, true);
                }
                return $notification;
            });

        return response()->json($notifications);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $notificationId)
    {
        \Log::info('Mark as read request', [
            'notificationId' => $notificationId,
            'userId' => $request->user()->id,
            'userRole' => $request->user()->role,
        ]);

        // Only allow Admins and Music Deans
        if (!in_array($request->user()->role, ['Administrator', 'Music Dean'])) {
            \Log::warning('Unauthorized mark as read attempt', ['userId' => $request->user()->id]);
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $updated = DB::table('notifications')
            ->where('id', $notificationId)
            ->where('notifiable_id', $request->user()->id)
            ->update(['read_at' => now()]);

        \Log::info('Mark as read result', ['updated' => $updated]);

        if (!$updated) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $notificationId)
    {
        // Only allow Admins and Music Deans
        if (!in_array($request->user()->role, ['Administrator', 'Music Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $deleted = DB::table('notifications')
            ->where('id', $notificationId)
            ->where('notifiable_id', $request->user()->id)
            ->delete();

        if (!$deleted) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        return response()->json(['success' => true]);
    }
}
