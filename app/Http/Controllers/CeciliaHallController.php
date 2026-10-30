<?php

namespace App\Http\Controllers;

use App\Models\CeciliaHallBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class CeciliaHallController extends Controller
{
    /**
     * Display the Cecilia Hall booking page
     */
    public function index()
    {
        $user = auth()->user();
        $canBook = $user && in_array($user->role, ['Student Assistant', 'Music Dean', 'Administrator']);
        
        // Get all non-rejected bookings
        $bookings = CeciliaHallBooking::where('status', '!=', 'rejected')
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'name' => $booking->name,
                    'email' => $booking->email,
                    'booker_type' => $booking->booker_type,
                    'date' => $booking->getRawOriginal('date'), // Get raw date without timezone conversion
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'purpose' => $booking->purpose,
                    'status' => $booking->status,
                    'letter_url' => $booking->letter_path ? route('cecilia-hall.view-letter', $booking->id) : null,
                ];
            });


        return Inertia::render('CeciliaHall', [
            'bookings' => $bookings,
            'canBook' => $canBook,
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'profile_picture_path' => $user->profile_picture_path,
                ] : null,
            ],
        ]);
    }

    /**
     * Store a new booking request
     */
    public function store(Request $request)
    {
        // Check authorization
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['Student Assistant', 'Music Dean', 'Administrator'])) {
            return response()->json([
                'error' => 'Only Student Assistants, Administrators, and Music Dean can create bookings.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'booker_type' => 'required|in:music_department,external',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'purpose' => 'required|string|max:1000',
            'letter' => 'required_if:booker_type,external|nullable|file|mimes:pdf|max:5120',
        ]);

        // Sanitize purpose (prevent XSS)
        $validated['purpose'] = strip_tags($validated['purpose']);

        // Check if booking time is in the past
        $bookingDateTime = Carbon::parse($validated['date'] . ' ' . $validated['start_time']);
        if ($bookingDateTime->isPast()) {
            return response()->json([
                'error' => 'Cannot book a time slot that has already passed.'
            ], 422);
        }

        // Check for conflicts
        $booking = new CeciliaHallBooking($validated);
        if ($booking->hasConflict()) {
            return response()->json([
                'error' => 'The selected time slot conflicts with an existing booking.'
            ], 422);
        }

        // Handle letter upload
        if ($request->hasFile('letter')) {
            $file = $request->file('letter');
            
            // Sanitize filename
            $originalName = $file->getClientOriginalName();
            $sanitizedName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $originalName);
            $filename = time() . '_' . $sanitizedName;
            
            // Store with sanitized filename
            $path = $file->storeAs('cecilia-hall-letters', $filename, 'public');
            $validated['letter_path'] = $path;
        }

        // Create booking
        CeciliaHallBooking::create($validated);

        return response()->json([
            'message' => 'Your booking request has been submitted successfully! The Dean will review and approve your request.'
        ], 201);
    }

    /**
     * Update booking status (for Dean approval)
     */
    public function updateStatus(Request $request, $booking)
    {
        // Check if user is Music Dean
        if (!auth()->check() || auth()->user()->role !== 'Music Dean') {
            return response()->json([
                'error' => 'Only the Music Dean can approve or reject bookings.'
            ], 403);
        }

        $bookingModel = CeciliaHallBooking::find($booking);
        
        if (!$bookingModel) {
            return response()->json([
                'error' => 'Booking not found.'
            ], 404);
        }

        // Prevent modification of already approved bookings (except Dean can reject)
        if ($bookingModel->status === 'approved') {
            $validated = $request->validate([
                'status' => 'required|in:rejected',
                'rejection_reason' => 'required|string',
            ]);
        } else {
            $validated = $request->validate([
                'status' => 'required|in:approved,rejected',
                'rejection_reason' => 'required_if:status,rejected|nullable|string',
            ]);
        }

        // If approving, cancel any conflicting pending bookings
        if ($validated['status'] === 'approved') {
            $conflictingBookings = CeciliaHallBooking::where('id', '!=', $bookingModel->id)
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
                    'cancellation_reason' => 'Automatically cancelled due to conflict with approved booking on ' . 
                                        \Carbon\Carbon::parse($bookingModel->date)->format('M d, Y') . ' at ' . 
                                        $bookingModel->start_time . ' - ' . $bookingModel->end_time,
                    'cancelled_by' => auth()->id(),
                    'cancelled_at' => now(),
                ]);
            }
        }

        $bookingModel->update([
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        $message = 'Booking has been ' . $validated['status'] . ' successfully.';
        if ($validated['status'] === 'approved' && isset($conflictingBookings) && $conflictingBookings->count() > 0) {
            $message .= ' ' . $conflictingBookings->count() . ' conflicting pending booking(s) were automatically cancelled.';
        }

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }

    /**
     * Delete a booking
     */
    public function destroy($booking)
    {
        $user = auth()->user();
        
        // Check authorization
        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized.'
            ], 401);
        }

        $bookingModel = CeciliaHallBooking::find($booking);
        
        if (!$bookingModel) {
            return response()->json([
                'error' => 'Booking not found.'
            ], 404);
        }

        // Only Music Dean or the booking creator (for pending bookings) can delete
        $isMusicDean = $user->role === 'Music Dean';
        $isCreator = $user->email === $bookingModel->email;
        $isPending = $bookingModel->status === 'pending';
        
        if (!$isMusicDean && !($isCreator && $isPending)) {
            return response()->json([
                'error' => 'You can only delete your own pending bookings. Approved bookings can only be deleted by the Music Dean.'
            ], 403);
        }

        if ($bookingModel->letter_path) {
            Storage::disk('public')->delete($bookingModel->letter_path);
        }

        $bookingModel->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking has been deleted successfully.'
        ]);
    }

    /**
     * Show Dean approval page
     */
    public function approvals()
    {
        // Check if user is Music Dean
        if (auth()->user()->role !== 'Music Dean') {
            abort(403, 'Only the Music Dean can access the approval page.');
        }

        $pendingBookings = CeciliaHallBooking::whereIn('status', ['pending', 'cancelled'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'name' => $booking->name,
                    'email' => $booking->email,
                    'booker_type' => $booking->booker_type,
                    'date' => $booking->date->format('Y-m-d'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'purpose' => $booking->purpose,
                    'letter_url' => $booking->letter_path ? route('cecilia-hall.view-letter', $booking->id) : null,
                    'status' => $booking->status,
                    'cancellation_reason' => $booking->cancellation_reason,
                    'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('CeciliaHallApprovals', [
            'pendingBookings' => $pendingBookings
        ]);
    }

    /**
     * View authorization letter PDF
     */
    public function viewLetter($bookingId)
    {
        $booking = CeciliaHallBooking::find($bookingId);

        if (!$booking) {
            \Log::error('Booking not found', ['booking_id' => $bookingId]);
            abort(404, 'Booking not found');
        }

        if (!$booking->letter_path) {
            \Log::error('No letter path in booking', ['booking_id' => $bookingId]);
            abort(404, 'No authorization letter uploaded for this booking');
        }

        // The letter_path is stored relative to storage/app/public
        // So we need to get the full path from storage/app/public
        $filePath = storage_path('app/public/' . $booking->letter_path);

        if (!file_exists($filePath)) {
            \Log::error('PDF file not found', [
                'booking_id' => $bookingId,
                'letter_path' => $booking->letter_path,
                'full_path' => $filePath,
                'file_exists' => false,
            ]);
            abort(404, 'File not found: ' . $booking->letter_path);
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="authorization-letter.pdf"'
        ]);
    }
}
