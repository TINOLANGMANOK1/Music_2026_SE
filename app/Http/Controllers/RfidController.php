<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\CubicleBooking;
use App\Models\InstrumentBooking;
use App\Models\ToolBooking;
use Illuminate\Support\Facades\Log;

class RfidController extends Controller
{
    public function rfidScan(Request $request)
    {
        // Check if user is authenticated (either via web session or API token)
        if (!$request->user()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized - Please log in'], 401);
        }

        // If using API token, verify the token has the correct ability
        if ($request->bearerToken() && !$request->user()->tokenCan('rfid:scan')) {
            Log::warning('RFID scan attempted without proper token abilities', [
                'user_id' => $request->user()->id,
                'ip' => $request->ip()
            ]);
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        Log::info('RFID scan request received', [
            'rfid' => $request->input('rfid'),
            'user_id' => $request->user()?->id,
            'ip' => $request->ip()
        ]);

        try {
            $rfid = $request->input('rfid');
            $student = Student::where('rfid_uid', $rfid)->first();

            if (!$student) {
                Log::warning('Unknown RFID tag scanned', ['rfid' => $rfid]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student ID not recognized',
                    'error_type' => 'unrecognized_student',
                    'scanned_id' => $rfid
                ], 404);
            }

            Log::info('Student found for RFID', ['student_id' => $student->student_id]);

            $cubicleBookings = CubicleBooking::where('student_id', $student->student_id)->where('status', 'Active')->get();
            $instrumentBookings = InstrumentBooking::where('student_id', $student->student_id)->where('status', 'Active')->get();
            $toolBookings = ToolBooking::where('student_id', $student->student_id)->where('status', 'Active')->get();

            $activeBookings = [];

            foreach ($cubicleBookings as $booking) {
                // Note: The frontend needs the specific ID for the timeout endpoint (e.g., cubicle_id)
                $activeBookings[] = [
                    'id' => $booking->booking_id,
                    'type' => 'cubicle',
                    'details' => $booking->cubicle_type . ' ' . $booking->cubicle_no,
                    'resource_id' => $booking->cubicle_id,
                    'time_in' => $booking->time_in,
                ];
            }

            foreach ($instrumentBookings as $booking) {
                $activeBookings[] = [
                    'id' => $booking->booking_id,
                    'type' => 'instrument',
                    'details' => $booking->instrument_type,
                    'resource_id' => $booking->instrument_id,
                    'time_in' => $booking->time_in,
                ];
            }

            foreach ($toolBookings as $booking) {
                $activeBookings[] = [
                    'id' => $booking->booking_id,
                    'type' => 'tool',
                    'details' => $booking->tool_type,
                    'resource_id' => $booking->tool_id,
                    'time_in' => $booking->time_in,
                ];
            }

            Log::info('Found active bookings', ['count' => count($activeBookings)]);

            // Filter out MTL bookings (MTL bookings are managed through MTL Booking page only)
            $activeBookings = array_values(array_filter($activeBookings, function($booking) {
                return !($booking['type'] === 'cubicle' && stripos($booking['details'], 'mtl') !== false);
            }));

            if (count($activeBookings) === 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The student doesn\'t have existing booking',
                    'student' => [
                        'name' => $student->first_name . ' ' . $student->last_name,
                        'student_id' => $student->student_id,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'mtl_time_remaining' => (int) ($student->mtl_time_remaining ?? 480),
                        'year' => (int) ($student->year ?? 0),
                        'sec' => (string) ($student->sec ?? ''),
                    ],
                ]);
            }

            // Always return the list of bookings for the frontend to handle
            return response()->json([
                'student' => [
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_id' => $student->student_id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'mtl_time_remaining' => (int) ($student->mtl_time_remaining ?? 480),
                    'year' => (int) ($student->year ?? 0),
                    'sec' => (string) ($student->sec ?? ''),
                ],
                'bookings' => $activeBookings,
            ]);

        } catch (\Exception $e) {
            Log::error('Error during RFID scan process', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['status' => 'error', 'message' => 'A server error occurred.'], 500);
        }
    }

    public function rfidLogout(Request $request)
    {
        // Check if user is authenticated (either via web session or API token)
        if (!$request->user()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized - Please log in'], 401);
        }

        // If using API token, verify the token has the correct ability
        if ($request->bearerToken() && !$request->user()->tokenCan('rfid:logout')) {
            Log::warning('RFID logout attempted without proper token abilities', [
                'user_id' => $request->user()->id,
                'ip' => $request->ip()
            ]);
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        Log::info('RFID logout request received', [
            'user_id' => $request->user()?->id,
            'ip' => $request->ip()
        ]);

        // Add your logout logic here if needed
        return response()->json(['status' => 'success', 'message' => 'Logout successful']);
    }
}
