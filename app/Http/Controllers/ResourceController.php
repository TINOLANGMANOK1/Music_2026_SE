<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ResourceController extends Controller
{
    public function index()
    {
        // Log current authenticated user for debugging
        \Log::info('Resources accessed by user:', [
            'user_id' => auth()->id(),
            'user_name' => auth()->user()?->name,
            'user_role' => auth()->user()?->role,
            'session_id' => session()->getId(),
        ]);
        
        $perPage = 10; // Items per page
        $selectedOffice = request()->get('office', 'All'); // Get office filter from request

        $cubicles = DB::table('cubicle_info as ci')
            ->leftJoin('cubicle_bookings as cb', function ($join) {
                $join->on('ci.cubicle_id', '=', 'cb.cubicle_id')
                     ->where('cb.status', '=', 'Active');
            })
            ->leftJoin('student as s', 'cb.student_id', '=', 's.student_id')
            ->select(
                'ci.cubicle_id',
                'ci.cubicle_type',
                'ci.cubicle_no',
                'ci.status',
                DB::raw("CONCAT(s.first_name, ' ', s.last_name) as name"),
                DB::raw("CONCAT(s.year, '-', s.sec) as yr_sec"),
                'cb.time_in'
            )
            ->get()
            ->map(function ($item) {
                $item->name = $item->name ?? '-';
                $item->yr_sec = $item->yr_sec ?? '-';
                // Format time_in to ISO 8601 with timezone for consistent frontend parsing
                $item->time_in = $item->time_in ? \Carbon\Carbon::parse($item->time_in)->toIso8601String() : '-';
                return $item;
            });

        // Get all instruments first
        $allInstruments = DB::table('assets as a')
            ->leftJoin('instrument_bookings as ib', function ($join) {
                $join->on('a.id', '=', 'ib.instrument_id')
                     ->on('ib.status', '=', DB::raw("'Active'"));
            })
            ->leftJoin('student as s', 'ib.student_id', '=', 's.student_id')
            ->where('a.is_borrowable', 1)
            ->where(function($query) {
                $query->whereRaw('LOWER(a.category) = ?', ['musical instruments'])
                      ->orWhereRaw('LOWER(a.category) = ?', ['audio visual equipment'])
                      ->orWhereRaw('LOWER(a.category) = ?', ['audiovisual equipment']);
            })
            ->select(
                'a.id as instrument_id',
                'a.category as instrument_type',
                'a.asset_code as instrument_no',
                'a.name as instrument_name',
                'a.office',
                'a.status',
                DB::raw("CONCAT(s.first_name, ' ', s.last_name) as name"),
                DB::raw("CONCAT(s.year, '-', s.sec) as yr_sec"),
                'ib.time_in'
            )
            ->get()
            ->map(function ($item) {
                $item->name = $item->name ?? '-';
                $item->yr_sec = $item->yr_sec ?? '-';
                // Format time_in to ISO 8601 with timezone for consistent frontend parsing
                $item->time_in = $item->time_in ? \Carbon\Carbon::parse($item->time_in)->toIso8601String() : '-';
                return $item;
            });

        // Separate Musical Instruments and Audio Visual Equipment
        $musicalInstruments = $allInstruments->filter(function ($item) {
            $category = strtolower($item->instrument_type);
            return $category === 'musical instruments';
        })->sortBy(function ($item) {
            // Sort borrowed items first (0), then available (1)
            return strtolower($item->status) === 'borrowed' ? 0 : 1;
        });

        $audioVisualEquipment = $allInstruments->filter(function ($item) {
            $category = strtolower($item->instrument_type);
            return $category === 'audio visual equipment' || $category === 'audiovisual equipment';
        })->sortBy(function ($item) {
            // Sort borrowed items first (0), then available (1)
            return strtolower($item->status) === 'borrowed' ? 0 : 1;
        });

        // Apply office filter BEFORE pagination
        if ($selectedOffice !== 'All') {
            $musicalInstruments = $musicalInstruments->filter(function ($item) use ($selectedOffice) {
                return $item->office === $selectedOffice;
            });
            $audioVisualEquipment = $audioVisualEquipment->filter(function ($item) use ($selectedOffice) {
                return $item->office === $selectedOffice;
            });
        }

        // Paginate each category separately
        $musicalInstrumentsPage = request()->get('musical_page', 1);
        $audioVisualPage = request()->get('audio_visual_page', 1);

        $musicalInstrumentsPaginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $musicalInstruments->forPage($musicalInstrumentsPage, $perPage)->values(),
            $musicalInstruments->count(),
            $perPage,
            $musicalInstrumentsPage,
            ['path' => request()->url(), 'pageName' => 'musical_page']
        );

        $audioVisualPaginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $audioVisualEquipment->forPage($audioVisualPage, $perPage)->values(),
            $audioVisualEquipment->count(),
            $perPage,
            $audioVisualPage,
            ['path' => request()->url(), 'pageName' => 'audio_visual_page']
        );

        // Get tools separately with tool_bookings join
        $allTools = DB::table('assets as a')
            ->leftJoin('tool_bookings as tb', function ($join) {
                $join->on('a.id', '=', 'tb.tool_id')
                     ->on('tb.status', '=', DB::raw("'Active'"));
            })
            ->leftJoin('student as s', 'tb.student_id', '=', 's.student_id')
            ->where('a.is_borrowable', 1)
            ->where(function($query) {
                $query->whereRaw('LOWER(a.category) != ?', ['musical instruments'])
                      ->whereRaw('LOWER(a.category) != ?', ['audio visual equipment'])
                      ->whereRaw('LOWER(a.category) != ?', ['audiovisual equipment']);
            })
            ->select(
                'a.id as instrument_id',
                'a.category as instrument_type',
                'a.asset_code as instrument_no',
                'a.name as instrument_name',
                'a.office',
                'a.status',
                DB::raw("CONCAT(s.first_name, ' ', s.last_name) as name"),
                DB::raw("CONCAT(s.year, '-', s.sec) as yr_sec"),
                'tb.time_in',
                'tb.tool_id as booking_tool_id',
                'tb.student_id as booking_student_id'
            )
            ->get()
            ->map(function ($item) {
                $item->name = $item->name ?? '-';
                $item->yr_sec = $item->yr_sec ?? '-';
                // Format time_in to ISO 8601 with timezone for consistent frontend parsing
                $item->time_in = $item->time_in ? \Carbon\Carbon::parse($item->time_in)->toIso8601String() : '-';
                return $item;
            });

        \Log::info('TOOLS QUERY RESULT:', $allTools->where('instrument_no', 'EQ-MIC-00058')->toArray());

        // Apply office filter to tools
        if ($selectedOffice !== 'All') {
            $allTools = $allTools->filter(function ($item) use ($selectedOffice) {
                return $item->office === $selectedOffice;
            });
        }

        // Sort tools: borrowed first, then available
        $allTools = $allTools->sortBy(function ($item) {
            return strtolower($item->status) === 'borrowed' ? 0 : 1;
        });

        // Group tools by category and paginate each
        $toolsByCategory = $allTools->groupBy(function ($item) {
            return $item->instrument_type;
        });

        $paginatedToolsByCategory = [];
        foreach ($toolsByCategory as $category => $categoryTools) {
            $pageParam = strtolower(str_replace(' ', '_', $category)) . '_page';
            $currentPage = request()->get($pageParam, 1);
            
            $paginatedToolsByCategory[$category] = new \Illuminate\Pagination\LengthAwarePaginator(
                $categoryTools->forPage($currentPage, $perPage)->values()->map(function ($item) {
                    return (object) [
                        'instrument_id' => $item->instrument_id,
                        'instrument_no' => $item->instrument_no,
                        'instrument_type' => $item->instrument_type,
                        'instrument_name' => $item->instrument_name,
                        'office' => $item->office,
                        'status' => $item->status,
                        'name' => $item->name,
                        'yr_sec' => $item->yr_sec,
                        'time_in' => $item->time_in,
                    ];
                }),
                $categoryTools->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'pageName' => $pageParam]
            );
        }

        // Send all instruments (unpaginated) for office filter
        $allInstrumentsForFilter = $allInstruments->map(function ($item) {
            return [
                'instrument_id' => $item->instrument_id,
                'office' => $item->office,
                'instrument_type' => $item->instrument_type,
            ];
        });

        \Log::info('TOOLS BY CATEGORY COUNT: ' . count($paginatedToolsByCategory));
        \Log::info('TOOLS BY CATEGORY KEYS: ', array_keys($paginatedToolsByCategory));

        return Inertia::render('Resources', [
            'cubicles' => $cubicles,
            'musicalInstruments' => $musicalInstrumentsPaginated,
            'audioVisualEquipment' => $audioVisualPaginated,
            'toolsByCategory' => $paginatedToolsByCategory,
            'allInstrumentsForFilter' => $allInstrumentsForFilter,
            'selectedOffice' => $selectedOffice,
        ]);
    }
}
