<?php

namespace App\Http\Controllers;

use App\Models\MTLBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class MTLController extends Controller
{
    /**
     * Display the MTL booking page
     */
    public function index()
    {
        $user = auth()->user();
        $canBook = $user && in_array($user->role, ['Student Assistant', 'Music Dean', 'Administrator']);
        
        // Automatically update approved bookings to completed when end time has passed
        // Also deduct MTL time from students when marking as completed
        $completedBookings = MTLBooking::where('status', 'approved')
            ->where(function($query) {
                $query->where('date', '<', Carbon::today())
                    ->orWhere(function($q) {
                        $q->where('date', '=', Carbon::today())
                          ->whereRaw('TIME(end_time) < TIME(?)', [Carbon::now()->format('H:i:s')]);
                    });
            })
            ->get();

        foreach ($completedBookings as $booking) {
            // Calculate duration in minutes
            $startTime = Carbon::parse($booking->start_time);
            $endTime = Carbon::parse($booking->end_time);
            $durationMinutes = $startTime->diffInMinutes($endTime);

            // Use student_id from booking if available
            if ($booking->student_id) {
                $student = DB::table('student')
                    ->where('student_id', $booking->student_id)
                    ->first();

                // Deduct MTL time if student found
                if ($student) {
                    $newMtlTime = max(0, $student->mtl_time_remaining - $durationMinutes);
                    DB::table('student')
                        ->where('student_id', $student->student_id)
                        ->update(['mtl_time_remaining' => $newMtlTime]);
                    
                    \Log::info('MTL Time Deducted for Completed Booking', [
                        'student_id' => $student->student_id,
                        'booking_id' => $booking->id,
                        'old_mtl_time' => $student->mtl_time_remaining,
                        'duration_minutes' => $durationMinutes,
                        'new_mtl_time' => $newMtlTime,
                    ]);
                }
            }

            // Mark booking as completed
            $booking->update(['status' => 'completed']);
        }
        
        // Get all non-rejected bookings
        $bookings = MTLBooking::whereNotIn('status', ['rejected'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'name' => $booking->name,
                    'email' => $booking->email,
                    'date' => $booking->getRawOriginal('date'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'purpose' => $booking->purpose,
                    'status' => $booking->status,
                ];
            });

        // Get rejected bookings from the last 30 days
        $rejectedBookings = MTLBooking::where('status', 'rejected')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'name' => $booking->name,
                    'email' => $booking->email,
                    'date' => $booking->getRawOriginal('date'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'purpose' => $booking->purpose,
                    'status' => $booking->status,
                    'rejection_reason' => $booking->rejection_reason,
                ];
            });

        return Inertia::render('MTLBooking', [
            'bookings' => $bookings,
            'rejectedBookings' => $rejectedBookings,
            'canBook' => $canBook,
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ] : null,
            ],
        ]);
    }

    // Store new MTL booking
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'purpose' => 'nullable|string',
            'student_id' => 'required|string', // Require student_id from verified selection
        ]);

        // Calculate booking duration in minutes
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);
        $durationMinutes = $startTime->diffInMinutes($endTime);

        // Find student by student_id (already verified in frontend)
        $student = DB::table('student')
            ->where('student_id', $validated['student_id'])
            ->first();

        // Student must exist in the database
        if (!$student) {
            return response()->json([
                'error' => 'Student not found in the system. Please select a valid student from the dropdown.'
            ], 422);
        }

        // Check if student has enough MTL time
        $mtlTimeRemaining = $student->mtl_time_remaining ?? 0;
        if ($mtlTimeRemaining < $durationMinutes) {
            return response()->json([
                'error' => "Insufficient MTL time. Student has {$mtlTimeRemaining} minutes remaining but booking requires {$durationMinutes} minutes."
            ], 422);
        }

        // Check if booking is for today and time has already passed
        $bookingDateTime = Carbon::parse($validated['date'] . ' ' . $validated['start_time']);
        if ($bookingDateTime->isPast()) {
            return response()->json([
                'error' => 'Cannot book a time slot that has already passed'
            ], 422);
        }

        // Check for booking conflicts only with approved bookings
        if (MTLBooking::hasConflict($validated['date'], $validated['start_time'], $validated['end_time'])) {
            return response()->json([
                'error' => 'This time slot is already approved for another booking'
            ], 422);
        }

        $booking = MTLBooking::create([
            'user_id' => auth()->id(),
            'student_id' => $validated['student_id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'purpose' => $validated['purpose'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'MTL booking submitted successfully! Awaiting approval.',
            'booking' => $booking
        ]);
    }

    // Update booking status (approve/reject)
    public function updateStatus(Request $request, $booking)
    {
        $bookingModel = MTLBooking::find($booking);
        
        if (!$bookingModel) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        // Check if booking is already approved (prevent double approval)
        if ($bookingModel->status === 'approved') {
            return response()->json(['error' => 'Booking is already approved'], 422);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|max:500',
        ]);

        // Check for conflicts when approving
        if ($validated['status'] === 'approved') {
            if (MTLBooking::hasConflict($bookingModel->date, $bookingModel->start_time, $bookingModel->end_time, $bookingModel->id)) {
                return response()->json([
                    'error' => 'Cannot approve: This time slot conflicts with another approved booking'
                ], 422);
            }
        }

        // If approving, cancel any conflicting pending bookings
        $conflictingCount = 0;
        if ($validated['status'] === 'approved') {
            $conflictingBookings = MTLBooking::where('id', '!=', $bookingModel->id)
                ->where('status', 'pending')
                ->where('date', $bookingModel->date)
                ->where(function($query) use ($bookingModel) {
                    $query->where(function($q) use ($bookingModel) {
                        // Conflict: existing booking starts during this booking
                        $q->where('start_time', '<', $bookingModel->end_time)
                          ->where('start_time', '>=', $bookingModel->start_time);
                    })
                    ->orWhere(function($q) use ($bookingModel) {
                        // Conflict: existing booking ends during this booking
                        $q->where('end_time', '>', $bookingModel->start_time)
                          ->where('end_time', '<=', $bookingModel->end_time);
                    })
                    ->orWhere(function($q) use ($bookingModel) {
                        // Conflict: existing booking completely encompasses this booking
                        $q->where('start_time', '<=', $bookingModel->start_time)
                          ->where('end_time', '>=', $bookingModel->end_time);
                    });
                })
                ->get();

            foreach ($conflictingBookings as $conflicting) {
                $conflicting->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'Automatically cancelled due to conflict with approved MTL booking on ' . 
                                        $bookingModel->date . ' at ' . 
                                        $bookingModel->start_time . ' - ' . $bookingModel->end_time,
                    'cancelled_by' => auth()->id(),
                    'cancelled_at' => now(),
                ]);
            }
            $conflictingCount = $conflictingBookings->count();
        }

        // Update booking status
        $updateData = [
            'status' => $validated['status'],
        ];

        if ($validated['status'] === 'approved') {
            $updateData['approved_by'] = auth()->id();
            $updateData['approved_at'] = now();
        } else {
            $updateData['rejected_by'] = auth()->id();
            $updateData['rejected_at'] = now();
            $updateData['rejection_reason'] = $validated['rejection_reason'];
        }

        $bookingModel->update($updateData);

        $message = $validated['status'] === 'approved' 
            ? 'Booking approved successfully!' 
            : 'Booking rejected.';
        
        if ($validated['status'] === 'approved' && $conflictingCount > 0) {
            $message .= ' ' . $conflictingCount . ' conflicting pending booking(s) were automatically cancelled.';
        }

        return response()->json([
            'message' => $message,
            'booking' => $bookingModel->fresh()
        ]);
    }

    // Delete booking (only if not approved)
    public function destroy($booking)
    {
        $bookingModel = MTLBooking::find($booking);
        
        if (!$bookingModel) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        // Only allow deletion of own pending bookings or by admins
        if ($bookingModel->user_id !== auth()->id() && !in_array(auth()->user()->role, ['Administrator', 'Music Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Don't allow deletion of approved bookings (must be rejected instead)
        if ($bookingModel->status === 'approved') {
            return response()->json(['error' => 'Cannot delete an approved booking. Please reject it instead.'], 422);
        }

        // Check if booking has already passed
        $bookingEndDateTime = Carbon::parse($bookingModel->date . ' ' . $bookingModel->end_time);
        if ($bookingEndDateTime->isPast()) {
            return response()->json(['error' => 'Cannot delete a booking that has already ended'], 422);
        }

        // Delete the booking
        $bookingModel->delete();

        return response()->json([
            'message' => 'MTL booking deleted successfully!'
        ]);
    }

    // Show pending bookings for approval
    public function approvals()
    {
        $pendingBookings = MTLBooking::where('status', 'pending')
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'name' => $booking->name,
                    'email' => $booking->email,
                    'date' => $booking->getRawOriginal('date'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'purpose' => $booking->purpose,
                    'status' => $booking->status,
                    'created_at' => $booking->created_at->format('M d, Y H:i'),
                ];
            });

        return Inertia::render('MTLApprovals', [
            'pendingBookings' => $pendingBookings,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }
}