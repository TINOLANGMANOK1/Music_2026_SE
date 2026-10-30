<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'table' => ['sometimes', 'string', Rule::in(['cubicles', 'instruments', 'tools'])],
            'type' => ['nullable', 'string'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date', 'after_or_equal:startDate'],
        ]);

        $table = $filters['table'] ?? 'cubicles';

        // Get dynamic filter options based on table
        $filterOptions = [];
        if ($table === 'cubicles') {
            $filterOptions = DB::table('cubicle_info')
                ->distinct()
                ->pluck('cubicle_type')
                ->toArray();
        } elseif ($table === 'instruments') {
            $filterOptions = DB::table('assets')
                ->where('is_borrowable', 1)
                ->whereIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->distinct()
                ->pluck('office')
                ->filter()
                ->toArray();
        } else { // tools
            $filterOptions = DB::table('assets')
                ->where('is_borrowable', 1)
                ->whereNotIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->distinct()
                ->pluck('office')
                ->filter()
                ->toArray();
        }

        if ($table === 'cubicles') {
            $query = DB::table('cubicle_usage as cu')
                ->join('student as s', 'cu.student_id', '=', 's.student_id')
                ->join('cubicle_info as ci', 'cu.cubicle_id', '=', 'ci.cubicle_id')
                ->select(
                    DB::raw("CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_initial IS NOT NULL AND s.middle_initial != '', CONCAT(' ', LEFT(s.middle_initial, 1), '.'), '')) AS name"),
                    DB::raw("CONCAT(s.year, '-', s.sec) as yr_sec"),
                    'ci.cubicle_type as item_type',
                    'ci.cubicle_no as item_number',
                    'cu.start_time as time_in',
                    'cu.end_time as time_out',
                    DB::raw("CASE 
                        WHEN cu.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, cu.start_time, cu.end_time)
                        WHEN cu.start_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, cu.start_time, NOW())
                        ELSE NULL
                    END AS consumed_minutes"),
                    DB::raw("CASE 
                        WHEN cu.end_time IS NOT NULL THEN 'Completed'
                        WHEN cu.start_time IS NOT NULL THEN 'Ongoing'
                        ELSE 'Unknown'
                    END AS status"),
                    'cu.usage_date'
                );

            if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
                $query->whereBetween('cu.usage_date', [$filters['startDate'], $filters['endDate']]);
            }

            if (!empty($filters['type']) && $filters['type'] !== 'All') {
                $query->where('ci.cubicle_type', $filters['type']);
            }

        } else if ($table === 'tools') {
            $query = DB::table('tool_usage as tu')
                ->join('student as s', 'tu.student_id', '=', 's.student_id')
                ->join('assets as a', 'tu.tool_id', '=', 'a.id')
                ->select(
                    DB::raw("CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_initial IS NOT NULL AND s.middle_initial != '', CONCAT(' ', LEFT(s.middle_initial, 1), '.'), '')) AS name"),
                    DB::raw("CONCAT(s.year, '-', s.sec) as yr_sec"),
                    'a.category as item_type',
                    'a.name as item_name',
                    'a.asset_code as item_number',
                    'tu.start_time as time_in',
                    'tu.end_time as time_out',
                    DB::raw("CASE 
                        WHEN tu.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tu.start_time, tu.end_time)
                        WHEN tu.start_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tu.start_time, NOW())
                        ELSE NULL
                    END AS consumed_minutes"),
                    DB::raw("CASE 
                        WHEN tu.end_time IS NOT NULL THEN 'Completed'
                        WHEN tu.start_time IS NOT NULL THEN 'Ongoing'
                        ELSE 'Unknown'
                    END AS status"),
                    'tu.usage_date'
                );

            if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
                $query->whereBetween('tu.usage_date', [$filters['startDate'], $filters['endDate']]);
            }

            if (!empty($filters['type']) && $filters['type'] !== 'All') {
                $query->where('a.office', $filters['type']);
            }
        } else { // 'instruments'
            $query = DB::table('instrument_usage as iu')
                ->join('student as s', 'iu.student_id', '=', 's.student_id')
                ->join('assets as a', 'iu.instrument_id', '=', 'a.id')
                ->select(
                    DB::raw("CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_initial IS NOT NULL AND s.middle_initial != '', CONCAT(' ', LEFT(s.middle_initial, 1), '.'), '')) AS name"),
                    DB::raw("CONCAT(s.year, '-', s.sec) as yr_sec"),
                    'a.category as item_type',
                    'a.name as item_name',
                    'a.asset_code as item_number',
                    'iu.start_time as time_in',
                    'iu.end_time as time_out',
                    DB::raw("CASE 
                        WHEN iu.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, iu.start_time, iu.end_time)
                        WHEN iu.start_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, iu.start_time, NOW())
                        ELSE NULL
                    END AS consumed_minutes"),
                    DB::raw("CASE 
                        WHEN iu.end_time IS NOT NULL THEN 'Completed'
                        WHEN iu.start_time IS NOT NULL THEN 'Ongoing'
                        ELSE 'Unknown'
                    END AS status"),
                    'iu.usage_date'
                );

            if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
                $query->whereBetween('iu.usage_date', [$filters['startDate'], $filters['endDate']]);
            }

            if (!empty($filters['type']) && $filters['type'] !== 'All') {
                $query->where('a.office', $filters['type']);
            }
        }

        $logs = $query->orderByDesc('usage_date')->orderByDesc('time_in')->paginate(10)->withQueryString();

        return Inertia::render('ActivityLog', [
            'logs' => $logs,
            'filters' => $filters,
            'filterOptions' => $filterOptions
        ]);
    }

    /**
     * Get activity logs for a specific student (API endpoint)
     */
    public function getStudentActivityLog(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string',
        ]);

        $studentId = $validated['student_id'];
        $logs = [];

        // Fetch from cubicle_usage
        $cubicles = DB::table('cubicle_usage as cu')
            ->join('cubicle_info as ci', 'cu.cubicle_id', '=', 'ci.cubicle_id')
            ->where('cu.student_id', $studentId)
            ->select(
                DB::raw("'Cubicle' as item_type"),
                DB::raw('NULL as item_name'),
                DB::raw("CONCAT(ci.cubicle_type, ' ', ci.cubicle_no) as item_number"),
                'cu.start_time as time_in',
                'cu.end_time as time_out',
                DB::raw("CASE 
                    WHEN cu.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, cu.start_time, cu.end_time)
                    WHEN cu.start_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, cu.start_time, NOW())
                    ELSE NULL
                END AS consumed_minutes"),
                DB::raw("CASE 
                    WHEN cu.end_time IS NOT NULL THEN 'Completed'
                    WHEN cu.start_time IS NOT NULL THEN 'Ongoing'
                    ELSE 'Unknown'
                END AS status"),
                'cu.usage_date'
            )
            ->get();

        // Fetch from instrument_usage
        $instruments = DB::table('instrument_usage as iu')
            ->join('assets as a', 'iu.instrument_id', '=', 'a.id')
            ->where('iu.student_id', $studentId)
            ->select(
                DB::raw("'Instrument' as item_type"),
                'a.name as item_name',
                'a.asset_code as item_number',
                'iu.start_time as time_in',
                'iu.end_time as time_out',
                DB::raw("CASE 
                    WHEN iu.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, iu.start_time, iu.end_time)
                    WHEN iu.start_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, iu.start_time, NOW())
                    ELSE NULL
                END AS consumed_minutes"),
                DB::raw("CASE 
                    WHEN iu.end_time IS NOT NULL THEN 'Completed'
                    WHEN iu.start_time IS NOT NULL THEN 'Ongoing'
                    ELSE 'Unknown'
                END AS status"),
                'iu.usage_date'
            )
            ->get();

        // Fetch from tool_usage
        $tools = DB::table('tool_usage as tu')
            ->join('assets as a', 'tu.tool_id', '=', 'a.id')
            ->where('tu.student_id', $studentId)
            ->select(
                DB::raw("'Tool' as item_type"),
                'a.name as item_name',
                'a.asset_code as item_number',
                'tu.start_time as time_in',
                'tu.end_time as time_out',
                DB::raw("CASE 
                    WHEN tu.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tu.start_time, tu.end_time)
                    WHEN tu.start_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tu.start_time, NOW())
                    ELSE NULL
                END AS consumed_minutes"),
                DB::raw("CASE 
                    WHEN tu.end_time IS NOT NULL THEN 'Completed'
                    WHEN tu.start_time IS NOT NULL THEN 'Ongoing'
                    ELSE 'Unknown'
                END AS status"),
                'tu.usage_date'
            )
            ->get();

        // Combine all logs and sort by date descending
        $logs = $cubicles->concat($instruments)->concat($tools)
            ->sortByDesc('usage_date')
            ->sortByDesc('time_in')
            ->values();

        return response()->json([
            'logs' => $logs,
        ]);
    }
}
