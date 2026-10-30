<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\AdminActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MTLTimeController extends Controller
{
    public function resetMTLTime(Request $request)
    {
        \Log::info('MTL Reset Request received', [
            'user_role' => Auth::user()->role ?? 'null',
            'request_data' => $request->all()
        ]);

        // Only allow admins and music dean
        if (!in_array(Auth::user()->role, ['Administrator', 'Music Dean'])) {
            \Log::warning('Unauthorized MTL reset attempt', ['user_role' => Auth::user()->role]);
            return back()->withErrors(['message' => 'Unauthorized action.']);
        }

        try {
            $validated = $request->validate([
                'reset_type' => 'required|in:all,specific',
                'student_ids' => 'array',
                'student_ids.*' => 'exists:student,student_id',
            ]);

            // Additional validation for specific reset type
            if ($validated['reset_type'] === 'specific' && empty($validated['student_ids'])) {
                return back()->withErrors([
                    'message' => 'Please select at least one student when using specific reset.'
                ]);
            }

            \Log::info('Validation passed', ['validated' => $validated]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            return back()->withErrors([
                'message' => 'Validation failed: ' . json_encode($e->errors())
            ]);
        }

        try {
            DB::beginTransaction();

            $affectedCount = 0;
            $defaultMTLTime = 480; // 8 hours in minutes

            if ($validated['reset_type'] === 'all') {
                // Reset all students
                $affectedCount = Student::query()->update([
                    'mtl_time_remaining' => $defaultMTLTime
                ]);

                \Log::info('Reset all students', ['affected_count' => $affectedCount]);

                // Log the activity
                AdminActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'reset_mtl_time_all',
                    'description' => 'Reset MTL time for all students',
                    'details' => [
                        'reset_type' => 'all',
                        'affected_count' => $affectedCount,
                        'reset_value' => $defaultMTLTime,
                        'timestamp' => now()->toDateTimeString(),
                    ],
                    'ip_address' => $request->ip(),
                ]);
            } else {
                // Reset specific students
                $affectedCount = Student::whereIn('student_id', $validated['student_ids'])
                    ->update(['mtl_time_remaining' => $defaultMTLTime]);

                \Log::info('Reset specific students', ['affected_count' => $affectedCount]);

                // Log the activity
                AdminActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'reset_mtl_time_specific',
                    'description' => 'Reset MTL time for specific students',
                    'details' => [
                        'reset_type' => 'specific',
                        'student_ids' => $validated['student_ids'],
                        'affected_count' => $affectedCount,
                        'reset_value' => $defaultMTLTime,
                        'timestamp' => now()->toDateTimeString(),
                    ],
                    'ip_address' => $request->ip(),
                ]);
            }

            DB::commit();

            \Log::info('MTL reset successful', ['affected_count' => $affectedCount]);

            return back()->with([
                'success' => true,
                'message' => "MTL time has been reset for {$affectedCount} student(s)."
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('MTL reset failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors([
                'message' => 'Failed to reset MTL time: ' . $e->getMessage()
            ]);
        }
    }

    public function getAllStudents()
    {
        // Only allow admins and music dean
        if (!in_array(Auth::user()->role, ['Administrator', 'Music Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $students = Student::select([
            'student_id',
            'first_name',
            'last_name',
            'middle_initial',
            'year',
            'sec',
            'mtl_time_remaining'
        ])
        ->orderBy('last_name')
        ->orderBy('first_name')
        ->get();

        return response()->json($students)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}
