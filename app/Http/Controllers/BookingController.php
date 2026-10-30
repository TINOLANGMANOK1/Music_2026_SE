<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use App\Models\Student;
use App\Models\Instrument;
use App\Models\Tool;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function bookCubicle(Request $request)
    {
        // Validate input
        $request->validate([
            'cubicle_id' => 'required|exists:cubicle_info,cubicle_id',
            'student_id' => 'required|exists:student,student_id',
        ]);

        $cubicleId = $request->input('cubicle_id');
        $studentId = $request->input('student_id');

        // Fetch cubicle info and student from local database
        $cubicle = DB::table('cubicle_info')->where('cubicle_id', $cubicleId)->first();
        $student = DB::table('student')->where('student_id', $studentId)->first();

        if (!$cubicle) {
            return Redirect::back()->withErrors(['booking' => 'Cubicle not found.']);
        }

        if (!$student) {
            return Redirect::back()->withErrors(['booking' => 'Student not found.']);
        }

        // Check for existing active cubicle booking for this student
        if (DB::table('cubicle_bookings')->where('student_id', $studentId)->where('status', 'Active')->exists()) {
            return Redirect::back()->withErrors(['booking' => 'Student already has an active cubicle booking.']);
        }

        // Check MTL time remaining for MTL cubicles
        if ($cubicle->cubicle_type === 'MTL' && $student->mtl_time_remaining <= 0) {
            return Redirect::back()->withErrors(['booking' => 'No MTL session time remaining for this student.']);
        }

        // Log booking attempt
        Log::info('Cubicle booking attempt', [
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name,
            'student_id' => $studentId,
            'cubicle_id' => $cubicleId,
            'ip_address' => $request->ip(),
        ]);

        DB::beginTransaction();
        try {
            $cubicle = DB::table('cubicle_info')->where('cubicle_id', $cubicleId)->first();
            if (!$cubicle || $cubicle->status !== 'Available') {
                DB::rollBack();
                return Redirect::back()->withErrors(['booking' => 'Cubicle is not available.']);
            }

            // Insert into cubicle_bookings
            DB::table('cubicle_bookings')->insert([
                'student_id' => $studentId,
                'cubicle_id' => $cubicleId,
                'cubicle_no' => $cubicle->cubicle_no,
                'cubicle_type' => $cubicle->cubicle_type,
                'booking_date' => now()->toDateString(),
                'time_in' => now(),
                'status' => 'Active',
            ]);

            // Insert into cubicle_usage
            DB::table('cubicle_usage')->insert([
                'student_id' => $studentId,
                'cubicle_id' => $cubicleId,
                'cubicle_no' => $cubicle->cubicle_no,
                'usage_date' => now()->toDateString(),
                'start_time' => now(),
            ]);

            // Update cubicle_info status
            DB::table('cubicle_info')->where('cubicle_id', $cubicleId)->update(['status' => 'Occupied']);

            // Deduct MTL time if cubicle is MTL type (assuming MTL logic is handled elsewhere or simplified here)
            // This part needs to be carefully reviewed based on your old system's exact MTL deduction logic
            if ($cubicle->cubicle_type === 'MTL') {
                // Assuming MTL time deduction happens on timeout, not booking
            }

            DB::commit();
            return Redirect::back()->with('success', 'Cubicle booked successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return Redirect::back()->withErrors(['booking' => 'Booking failed: ' . $e->getMessage()]);
        }
    }

    public function bookInstrument(Request $request)
    {
        // Validate basic presence; we'll accept instrument ids from either the new `assets` table or the legacy `instrument_info` table.
        $request->validate([
            'instrument_id' => 'required',
            'student_id' => 'required|exists:student,student_id',
        ]);

        $instrumentId = $request->input('instrument_id');
        $studentId = $request->input('student_id');

        // REMOVED: Check for existing active instrument booking - Allow multiple instrument bookings per student
        // if (DB::table('instrument_bookings')->where('student_id', $studentId)->where('status', 'Active')->exists()) {
        //     return Redirect::back()->withErrors(['booking' => 'Student already has an active instrument booking.']);
        // }

        // Log incoming booking attempt
        Log::info('Attempting instrument booking', ['instrument_id' => $instrumentId, 'student_id' => $studentId]);

        // Log booking attempt
        Log::info('Instrument booking attempt', [
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name,
            'student_id' => $studentId,
            'instrument_id' => $instrumentId,
            'ip_address' => $request->ip(),
        ]);

        DB::beginTransaction();
        try {
            // Prefer the new `assets` table if present
            $asset = DB::table('assets')->where('id', $instrumentId)->first();

            if ($asset) {
                // Log asset state
                Log::info('Asset state for booking', ['asset' => $asset]);

                $status = is_string($asset->status) ? strtolower($asset->status) : '';
                $isBorrowable = (bool) $asset->is_borrowable;

                if ($status !== 'available' || !$isBorrowable) {
                    DB::rollBack();
                    $message = 'Instrument is not available.';
                    Log::warning('Booking failed - instrument not available', ['instrument_id' => $instrumentId, 'asset' => $asset]);
                    $isInertia = (bool) $request->header('X-Inertia');
                    if (!$isInertia && ($request->wantsJson() || $request->ajax())) {
                        return response()->json(['booking' => $message], 422);
                    }
                    return Redirect::back()->withErrors(['booking' => $message]);
                }

                // Insert into instrument_bookings (legacy table) using asset fields
                // instrument_no in legacy table expects an integer; use the asset id here to keep it numeric
                DB::table('instrument_bookings')->insert([
                    'student_id' => $studentId,
                    'instrument_id' => $instrumentId,
                    'instrument_no' => (int) $asset->id,
                    'instrument_type' => $asset->category,
                    'booking_date' => now()->toDateString(),
                    'time_in' => now(),
                    'status' => 'Active',
                ]);

                // Insert into instrument_usage
                DB::table('instrument_usage')->insert([
                    'student_id' => $studentId,
                    'instrument_id' => $instrumentId,
                    'instrument_no' => (int) $asset->id,
                    'usage_date' => now()->toDateString(),
                    'start_time' => now(),
                ]);

                // Update assets status to Borrowed
                DB::table('assets')->where('id', $instrumentId)->update(['status' => 'Borrowed']);

                DB::commit();
                Log::info('Instrument booked', ['instrument_id' => $instrumentId, 'student_id' => $studentId]);
                $isInertia = (bool) $request->header('X-Inertia');
                if (!$isInertia && ($request->wantsJson() || $request->ajax())) {
                    return response()->json(['success' => true, 'message' => 'Instrument booked successfully!']);
                }
                return Redirect::back()->with('success', 'Instrument booked successfully!');
            }

            // Fallback to legacy instrument_info table if no asset found
            $instrument = DB::table('instrument_info')->where('instrument_id', $instrumentId)->first();
            if (!$instrument || (is_string($instrument->status) && strtolower($instrument->status) !== 'available')) {
                DB::rollBack();
                $message = 'Instrument is not available.';
                Log::warning('Booking failed - instrument not available (legacy)', ['instrument_id' => $instrumentId, 'instrument' => $instrument]);
                $isInertia = (bool) $request->header('X-Inertia');
                if (!$isInertia && ($request->wantsJson() || $request->ajax())) {
                    return response()->json(['booking' => $message], 422);
                }
                return Redirect::back()->withErrors(['booking' => $message]);
            }

            // Insert into instrument_bookings (legacy)
            DB::table('instrument_bookings')->insert([
                'student_id' => $studentId,
                'instrument_id' => $instrumentId,
                'instrument_no' => $instrument->instrument_no,
                'instrument_type' => $instrument->instrument_type,
                'booking_date' => now()->toDateString(),
                'time_in' => now(),
                'status' => 'Active',
            ]);

            DB::table('instrument_usage')->insert([
                'student_id' => $studentId,
                'instrument_id' => $instrumentId,
                'instrument_no' => $instrument->instrument_no,
                'usage_date' => now()->toDateString(),
                'start_time' => now(),
            ]);

            DB::table('instrument_info')->where('instrument_id', $instrumentId)->update(['status' => 'Borrowed']);

            DB::commit();
            Log::info('Instrument booked (legacy)', ['instrument_id' => $instrumentId, 'student_id' => $studentId]);
            $isInertia = (bool) $request->header('X-Inertia');
            if (!$isInertia && ($request->wantsJson() || $request->ajax())) {
                return response()->json(['success' => true, 'message' => 'Instrument booked successfully!']);
            }
            return Redirect::back()->with('success', 'Instrument booked successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Instrument booking exception', ['exception' => $e]);
            $err = 'Booking failed: ' . $e->getMessage();
            $isInertia = (bool) $request->header('X-Inertia');
            if (!$isInertia && ($request->wantsJson() || $request->ajax())) {
                return response()->json(['booking' => $err], 500);
            }
            return Redirect::back()->withErrors(['booking' => $err]);
        }
    }

    public function bookTool(Request $request)
    {
        $request->validate([
            'tool_ids' => 'required|array',
            'tool_ids.*' => 'required|exists:assets,id',
            'student_id' => 'required|exists:student,student_id',
        ]);

        $toolIds = $request->input('tool_ids');
        $studentId = $request->input('student_id');

        DB::beginTransaction();
        try {
            foreach ($toolIds as $toolId) {
                $tool = DB::table('assets')->where('id', $toolId)->first();

                if (!$tool || strtolower($tool->status) !== 'available' || !$tool->is_borrowable) {
                    DB::rollBack();
                    return Redirect::back()->withErrors(['booking' => "Tool {$tool->asset_code} is not available."]);
                }

                $timeIn = now();

                // Insert into tool_bookings
                DB::table('tool_bookings')->insert([
                    'student_id' => $studentId,
                    'tool_id' => $toolId,
                    'tool_no' => (int) $tool->id,
                    'tool_type' => $tool->category,
                    'booking_date' => $timeIn->toDateString(),
                    'time_in' => $timeIn,
                    'status' => 'Active',
                ]);

                // Insert into tool_usage for activity log
                DB::table('tool_usage')->insert([
                    'student_id' => $studentId,
                    'tool_id' => $toolId,
                    'tool_no' => (int) $tool->id,
                    'usage_date' => $timeIn->toDateString(),
                    'start_time' => $timeIn,
                ]);

                // Update assets status
                DB::table('assets')->where('id', $toolId)->update(['status' => 'Borrowed']);
            }

            DB::commit();
            return Redirect::back()->with('success', 'Tool(s) booked successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return Redirect::back()->withErrors(['booking' => 'Booking failed: ' . $e->getMessage()]);
        }
    }

    public function getAvailableCubicles()
    {
        $cubicles = DB::table('cubicle_info')->where('status', 'Available')->get();

        $groupedCubicles = [
            'Piano' => [],
            'Guitar' => [],
        ];

        foreach ($cubicles as $cubicle) {
            if (array_key_exists($cubicle->cubicle_type, $groupedCubicles)) {
                $groupedCubicles[$cubicle->cubicle_type][] = $cubicle;
            }
        }

        return response()->json($groupedCubicles);
    }

    public function getAvailableInstruments()
    {
        // Prefer returning rows from the `assets` table (new canonical source)
        $instruments = DB::table('assets')
            ->where('is_borrowable', 1)
            ->whereRaw('LOWER(status) = ?', ['available'])
            ->whereIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
            ->get();
        return response()->json($instruments);
    }

    public function getAvailableTools()
    {
        $tools = DB::table('assets')
            ->where('is_borrowable', 1)
            ->whereRaw('LOWER(status) = ?', ['available'])
            ->whereRaw('LOWER(category) NOT IN (?, ?)', ['musical instruments', 'audio visual equipment'])
            ->get();
        return response()->json($tools);
    }

    public function timeoutCubicle(Request $request)
    {
        $request->validate([
            'cubicle_id' => 'required|exists:cubicle_info,cubicle_id',
        ]);

        $cubicleId = $request->input('cubicle_id');
        $timeOut = now(); // This is in Asia/Manila timezone

        DB::beginTransaction();
        try {
            $booking = DB::table('cubicle_bookings')
                ->where('cubicle_id', $cubicleId)
                ->where('status', 'Active')
                ->first();

            if (!$booking) {
                DB::rollBack();
                return Redirect::back()->withErrors(['timeout' => 'Active booking not found for this cubicle.']);
            }

            // Parse time_in with timezone awareness - Carbon handles timezone automatically
            $timeIn = \Carbon\Carbon::parse($booking->time_in);
            $durationInMinutes = abs($timeOut->diffInMinutes($timeIn, false)); // Use absolute value to ensure positive duration

            // Update cubicle_usage
            DB::table('cubicle_usage')
                ->where('cubicle_id', $cubicleId)
                ->whereNull('end_time')
                ->update(['end_time' => $timeOut]);

            // Delete from cubicle_bookings
            DB::table('cubicle_bookings')
                ->where('cubicle_id', $cubicleId)
                ->where('status', 'Active')
                ->delete();

            // Update cubicle_info status
            DB::table('cubicle_info')
                ->where('cubicle_id', $cubicleId)
                ->update(['status' => 'Available']);

            // Deduct MTL time if cubicle is MTL type
            $cubicleInfo = DB::table('cubicle_info')->where('cubicle_id', $cubicleId)->first();
            if ($cubicleInfo && $cubicleInfo->cubicle_type === 'MTL') {
                $student = DB::table('student')->where('student_id', $booking->student_id)->first();
                if ($student) {
                    $oldMtlTime = $student->mtl_time_remaining;
                    $newMtlTimeRemaining = max(0, $student->mtl_time_remaining - $durationInMinutes);
                    
                    // Log the MTL time deduction
                    Log::info('MTL Time Deduction', [
                        'student_id' => $booking->student_id,
                        'old_mtl_time' => $oldMtlTime,
                        'duration_minutes' => $durationInMinutes,
                        'new_mtl_time' => $newMtlTimeRemaining,
                        'time_in' => $timeIn,
                        'time_out' => $timeOut
                    ]);
                    
                    DB::table('student')->where('student_id', $booking->student_id)->update(['mtl_time_remaining' => $newMtlTimeRemaining]);
                }
            }

            DB::commit();
            return Redirect::back()->with('success', 'Cubicle timed out successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return Redirect::back()->withErrors(['timeout' => 'Timeout failed: ' . $e->getMessage()]);
        }
    }

    public function timeoutInstrument(Request $request)
    {
        $request->validate([
            'instrument_id' => 'required',
        ]);

        $instrumentId = $request->input('instrument_id');
        $timeOut = now();

        DB::beginTransaction();
        try {
            $booking = DB::table('instrument_bookings')
                ->where('instrument_id', $instrumentId)
                ->where('status', 'Active')
                ->first();

            if (!$booking) {
                DB::rollBack();
                return Redirect::back()->withErrors(['timeout' => 'Active booking not found for this instrument.']);
            }

            // Parse time_in with timezone awareness - Carbon handles timezone automatically
            $timeIn = \Carbon\Carbon::parse($booking->time_in);
            $durationInMinutes = $timeOut->diffInMinutes($timeIn);

            // Update instrument_usage
            DB::table('instrument_usage')
                ->where('instrument_id', $instrumentId)
                ->whereNull('end_time')
                ->update(['end_time' => $timeOut]);

            // Delete from instrument_bookings
            DB::table('instrument_bookings')
                ->where('instrument_id', $instrumentId)
                ->where('status', 'Active')
                ->delete();

            // Update status in either `assets` or `instrument_info` table
            $asset = DB::table('assets')->where('id', $instrumentId)->first();
            if ($asset) {
                DB::table('assets')->where('id', $instrumentId)->update(['status' => 'Available']);
            } else {
                DB::table('instrument_info')->where('instrument_id', $instrumentId)->update(['status' => 'Available']);
            }

            DB::commit();
            return Redirect::back()->with('success', 'Instrument timed out successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return Redirect::back()->withErrors(['timeout' => 'Timeout failed: ' . $e->getMessage()]);
        }
    }

    public function timeoutTool(Request $request)
    {
        $request->validate([
            'tool_id' => 'required|exists:assets,id',
        ]);

        $toolId = $request->input('tool_id');
        $timeOut = now();

        DB::beginTransaction();
        try {
            $booking = DB::table('tool_bookings')
                ->where('tool_id', $toolId)
                ->where('status', 'Active')
                ->first();

            if (!$booking) {
                DB::rollBack();
                return Redirect::back()->withErrors(['timeout' => 'Active booking not found for this tool.']);
            }

            // Parse time_in with timezone awareness - Carbon handles timezone automatically
            $timeIn = \Carbon\Carbon::parse($booking->time_in);
            $durationInMinutes = $timeOut->diffInMinutes($timeIn);

            // Update tool_usage with end_time
            DB::table('tool_usage')
                ->where('tool_id', $toolId)
                ->where('student_id', $booking->student_id)
                ->whereNull('end_time')
                ->update([
                    'end_time' => $timeOut,
                ]);

            // Delete from tool_bookings
            DB::table('tool_bookings')
                ->where('tool_id', $toolId)
                ->where('status', 'Active')
                ->delete();

            // Update assets status
            DB::table('assets')
                ->where('id', $toolId)
                ->update(['status' => 'Available']);

            DB::commit();
            return Redirect::back()->with('success', 'Tool timed out successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return Redirect::back()->withErrors(['timeout' => 'Timeout failed: ' . $e->getMessage()]);
        }
    }
}
