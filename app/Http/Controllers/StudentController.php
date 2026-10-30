<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\AdminActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        // Always query local database to show manually added students
        $query = Student::query();

        // Apply search filter
        $search = $request->input('search', '');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%")
                  ->orWhere('rfid_uid', 'like', "%{$search}%");
            });
        }

        // Apply year filter
        $year = $request->input('year', 'All');
        if ($year !== 'All') {
            $query->where('year', '=', (int)$year);
        }

        // Apply section filter
        $sec = $request->input('sec', 'All');
        if ($sec !== 'All') {
            $query->where('sec', '=', $sec);
        }

        // Paginate results from local database
        $students = $query->orderBy('last_name')->orderBy('first_name')->paginate(10);

        $sections = Student::query()->select('sec')->distinct()->pluck('sec');

        return Inertia::render('StudentInformation', [
            'students' => $students,
            'filters' => $request->only(['search', 'year', 'sec']),
            'sections' => $sections,
        ]);
    }

    public function apiSearch(Request $request)
    {
        $search = $request->input('search');

        $students = Student::query()
            ->when($search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('rfid_uid', 'like', "%{$search}%"); // Search by RFID but don't expose it
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(10) // Limit results for API search
            ->get();

        // Only return fields needed by frontend (exclude rfid_uid for security)
        $safeData = $students->map(function ($student) {
            return [
                'student_id' => $student->student_id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'middle_initial' => $student->middle_initial,
                'year' => $student->year,
                'sec' => $student->sec,
                'mtl_time_remaining' => $student->mtl_time_remaining, // Needed for cubicle booking validation
            ];
        });

        return response()->json($safeData)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string|max:50|unique:student,student_id',
            'rfid_uid' => 'nullable|string|max:255|unique:student,rfid_uid',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_initial' => 'nullable|string|max:50',
            'year' => 'required|integer|min:1|max:4',
            'sec' => 'required|string|max:50',
            'mtl_time_remaining' => 'nullable|integer|min:0',
        ]);

        // Set default for mtl_time_remaining if not provided
        if (!isset($validated['mtl_time_remaining'])) {
            $validated['mtl_time_remaining'] = 480;
        }

        $student = Student::create($validated);

        // Log the activity
        AdminActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create_student',
            'description' => 'Created new student: ' . $student->first_name . ' ' . $student->last_name,
            'details' => [
                'student_id' => $student->student_id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'timestamp' => now()->toDateTimeString(),
            ],
            'ip_address' => request()->ip(),
        ]);

        return Redirect::route('student-information.index')
            ->with('success', 'Student added successfully!');
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return Redirect::route('student-information.index');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|string|exists:student,student_id',
        ]);

        $studentIds = $validated['student_ids'];
        $count = count($studentIds);

        // Get student details for logging before deletion
        $students = Student::whereIn('student_id', $studentIds)->get();

        // Delete the students
        Student::whereIn('student_id', $studentIds)->delete();

        // Log the activity
        AdminActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'bulk_delete_students',
            'description' => "Deleted {$count} student(s)",
            'details' => [
                'count' => $count,
                'student_ids' => $studentIds,
                'students' => $students->map(fn($s) => $s->first_name . ' ' . $s->last_name)->toArray(),
                'timestamp' => now()->toDateTimeString(),
            ],
            'ip_address' => request()->ip(),
        ]);

        return Redirect::route('student-information.index')
            ->with('success', "{$count} student(s) deleted successfully!");
    }

    public function syncExternalStudents()
    {
        try {
            // Run the sync command
            \Artisan::call('sync:external-students', ['--force' => true]);

            // Get the command output
            $output = \Artisan::output();

            // Log the sync activity
            AdminActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'sync_external_students',
                'description' => 'Synced student data from external API',
                'details' => [
                    'output' => $output,
                    'timestamp' => now()->toDateTimeString(),
                ],
                'ip_address' => request()->ip(),
            ]);

            return Redirect::route('student-information.index')
                ->with('success', 'Student data synced successfully from external API!');
        } catch (\Exception $e) {
            // Log the failed sync attempt
            AdminActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'sync_external_students_failed',
                'description' => 'Failed to sync student data from external API',
                'details' => [
                    'error' => $e->getMessage(),
                    'timestamp' => now()->toDateTimeString(),
                ],
                'ip_address' => request()->ip(),
            ]);

            return Redirect::route('student-information.index')
                ->withErrors(['sync' => 'Sync failed: ' . $e->getMessage()]);
        }
    }
}