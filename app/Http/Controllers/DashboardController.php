<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Show simplified dashboard for Student Assistant
        if ($user->role === 'Student Assistant') {
            try {
                // Get recent Cecilia Hall bookings
                $ceciliaHallBookings = DB::table('cecilia_hall_bookings')
                ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'name' => $booking->name,
                        'email' => $booking->email,
                        'date' => Carbon::parse($booking->date)->format('M d, Y'),
                        'time' => Carbon::parse($booking->start_time)->format('g:i A') . ' - ' . 
                                 Carbon::parse($booking->end_time)->format('g:i A'),
                        'purpose' => $booking->purpose,
                        'status' => $booking->status,
                        'booker_type' => $booking->booker_type,
                    ];
                });
            
            // Get recent MTL bookings
            $mtlBookings = DB::table('mtl_bookings')
                ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'name' => $booking->name,
                        'email' => $booking->email,
                        'date' => Carbon::parse($booking->date)->format('M d, Y'),
                        'time' => Carbon::parse($booking->start_time)->format('g:i A') . ' - ' . 
                                 Carbon::parse($booking->end_time)->format('g:i A'),
                        'purpose' => $booking->purpose,
                        'status' => $booking->status,
                    ];
                });

            // Count pending bookings (all types that SA can view/process)
            $pendingCeciliaHall = DB::table('cecilia_hall_bookings')
                ->where('status', 'pending')
                ->count();
            
            $pendingMTL = DB::table('mtl_bookings')
                ->where('status', 'pending')
                ->count();
            
            $pendingCubicles = DB::table('cubicle_bookings')
                ->where('status', 'pending')
                ->count();
            
            $pendingInstruments = DB::table('instrument_bookings')
                ->where('status', 'pending')
                ->count();
            
            $pendingTools = DB::table('tool_bookings')
                ->where('status', 'pending')
                ->count();
            
            // Today's statistics
            $today = Carbon::today();
            
            $todayBookings = DB::table('cubicle_bookings')
                ->whereDate('booking_date', $today)
                ->count() +
                DB::table('instrument_bookings')
                ->whereDate('booking_date', $today)
                ->count() +
                DB::table('tool_bookings')
                ->whereDate('booking_date', $today)
                ->count();
            
            // Available resources count
            $availableInstruments = DB::table('assets')
                ->where('is_borrowable', 1)
                ->whereIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->where('status', 'available')
                ->count();
            
            $availableTools = DB::table('assets')
                ->where('is_borrowable', 1)
                ->whereNotIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->where('status', 'available')
                ->count();
            
            $availableCubicles = DB::table('cubicle_info')
                ->where('status', 'Available')
                ->count();
            
            return Inertia::render('StudentAssistantDashboard', [
                'auth' => [
                    'user' => $user
                ],
                'ceciliaHallBookings' => $ceciliaHallBookings,
                'mtlBookings' => $mtlBookings,
                'pendingCount' => $pendingCeciliaHall,
                'pendingMTLCount' => $pendingMTL,
                'stats' => [
                    'todayBookings' => $todayBookings,
                    'pendingApprovals' => $pendingCeciliaHall + $pendingMTL + $pendingCubicles + $pendingInstruments + $pendingTools,
                    'availableInstruments' => $availableInstruments,
                    'availableTools' => $availableTools,
                    'availableCubicles' => $availableCubicles,
                ],
                'loginSuccess' => $request->session()->get('loginSuccess', false),
            ]);
            } catch (\Exception $e) {
                Log::error('Student Assistant Dashboard error: ' . $e->getMessage());
                return Inertia::render('StudentAssistantDashboard', [
                    'auth' => ['user' => $user],
                    'ceciliaHallBookings' => [],
                    'mtlBookings' => [],
                    'pendingCount' => 0,
                    'pendingMTLCount' => 0,
                    'stats' => [
                        'todayBookings' => 0,
                        'pendingApprovals' => 0,
                        'availableInstruments' => 0,
                        'availableTools' => 0,
                        'availableCubicles' => 0,
                    ],
                    'loginSuccess' => false,
                ]);
            }
        }
        
        // Show simplified dashboard for Student Panel
        if ($user->role === 'Student Panel') {
            try {
                // Available resources count
                $availableInstruments = DB::table('assets')
                ->where('is_borrowable', 1)
                ->whereIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->where('status', 'available')
                ->count();
            
            $availableTools = DB::table('assets')
                ->where('is_borrowable', 1)
                ->whereNotIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->where('status', 'available')
                ->count();
            
            $availableCubicles = DB::table('cubicle_info')
                ->where('status', 'Available')
                ->count();
            
            return Inertia::render('StudentPanelDashboard', [
                'auth' => [
                    'user' => $user
                ],
                'stats' => [
                    'availableInstruments' => $availableInstruments,
                    'availableTools' => $availableTools,
                    'availableCubicles' => $availableCubicles,
                ],
                'loginSuccess' => $request->session()->get('loginSuccess', false),
            ]);
            } catch (\Exception $e) {
                Log::error('Student Panel Dashboard error: ' . $e->getMessage());
                return Inertia::render('StudentPanelDashboard', [
                    'auth' => ['user' => $user],
                    'stats' => [
                        'availableInstruments' => 0,
                        'availableTools' => 0,
                        'availableCubicles' => 0,
                    ],
                    'loginSuccess' => false,
                ]);
            }
        }
        
        // Original dashboard for Admin, Music Dean, Administrator roles
        try {
        $cubicleCounts = DB::table('cubicle_info')
            ->select(
                'cubicle_type',
                DB::raw('CAST(count(*) AS UNSIGNED) as total_count'),
                DB::raw('CAST(SUM(CASE WHEN status = "Available" THEN 1 ELSE 0 END) AS UNSIGNED) as available_count')
            )
            ->groupBy('cubicle_type')
            ->get()
            ->keyBy('cubicle_type');

        // Instruments - now using assets table, grouped by instrument name
        $instrumentCounts = DB::table('assets')
            ->select(
                'name',
                DB::raw('CAST(count(*) AS UNSIGNED) as total_count'),
                DB::raw('CAST(SUM(CASE WHEN LOWER(status) = "available" THEN 1 ELSE 0 END) AS UNSIGNED) as available_count')
            )
            ->where('is_borrowable', 1)
            ->whereIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
            ->groupBy('name')
            ->get()
            ->keyBy('name');

        // Tools - now using assets table, excluding instruments
        $toolCounts = DB::table('assets')
            ->select(
                'category',
                DB::raw('CAST(count(*) AS UNSIGNED) as total_count'),
                DB::raw('CAST(SUM(CASE WHEN LOWER(status) = "available" THEN 1 ELSE 0 END) AS UNSIGNED) as available_count')
            )
            ->where('is_borrowable', 1)
            ->whereNotIn('category', ['Musical Instruments', 'Audio Visual Equipment'])
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        // Get statistics for gradient cards
        $stats = $this->getDashboardStats();

        // Get resources utilization by year level
        $requestedUtilizationSemester = $request->input('utilizationSemester', $this->getCurrentSemester());
        $utilizationByYear = $this->getUtilizationByYearLevel($requestedUtilizationSemester);

        // Get cubicle usage count
        $cubicleUsage = $this->getCubicleUsage();

        // Get 12-week resources usage trend
        $weeklyUsageTrend = $this->getWeeklyUsageTrend();

        // Get combined conditions (assets + cubicles)
        $combinedConditions = $this->getCombinedConditions();

        // Get asset chart data
        $assetChart = $this->getAssetChartData();

        // Get Cecilia Hall bookings
        $ceciliaHallBookings = $this->getCeciliaHallBookings();

        // Get MTL bookings
        $mtlBookings = $this->getMTLBookings();

        // Get semester calendar data
        $availableSemesters = $this->getAvailableSemesters();
        $currentSemester = $this->getCurrentSemester();
        $requestedSemester = $request->input('semester', $currentSemester);
        $semesterBookings = $this->getSemesterBookings($requestedSemester);

        return Inertia::render('dashboard', [
            'counts' => [
                'cubicles' => $cubicleCounts,
                'instruments' => $instrumentCounts,
                'tools' => $toolCounts,
            ],
            'stats' => $stats,
            'utilizationByYear' => $utilizationByYear,
            'cubicleUsage' => $cubicleUsage,
            'weeklyUsageTrend' => $weeklyUsageTrend,
            'combinedConditions' => $combinedConditions,
            'assetChart' => $assetChart,
            'ceciliaHallBookings' => $ceciliaHallBookings,
            'mtlBookings' => $mtlBookings,
            'availableSemesters' => $availableSemesters,
            'currentSemester' => $currentSemester,
            'semesterBookings' => $semesterBookings,
            'loginSuccess' => $request->session()->get('loginSuccess', false),
        ]);
        } catch (\Exception $e) {
            Log::error('Dashboard error: ' . $e->getMessage(), ['exception' => $e]);
            return Inertia::render('dashboard', [
                'counts' => [
                    'cubicles' => collect(),
                    'instruments' => collect(),
                    'tools' => collect(),
                ],
                'stats' => [
                    'pendingApprovals' => 0,
                    'itemsUnderRepair' => 0,
                    'mostBorrowedInstrument' => ['count' => 0, 'name' => 'N/A'],
                    'mostUsedCubicle' => ['count' => 0, 'type' => 'N/A'],
                ],
                'utilizationByYear' => [],
                'cubicleUsage' => [],
                'weeklyUsageTrend' => [],
                'combinedConditions' => [],
                'assetChart' => [],
                'ceciliaHallBookings' => [],
                'mtlBookings' => [],
                'availableSemesters' => [],
                'currentSemester' => $this->getCurrentSemester(),
                'semesterBookings' => ['semester' => null, 'bookings' => []],
                'loginSuccess' => $request->session()->get('loginSuccess', false),
            ]);
        }
    }

    private function getDashboardStats()
    {
        // Pending approvals count (Cecilia Hall + MTL + Cubicle + Instrument + Tool bookings)
        $pendingCeciliaHall = DB::table('cecilia_hall_bookings')
            ->where('status', 'pending')
            ->count();
        
        $pendingMTL = DB::table('mtl_bookings')
            ->where('status', 'pending')
            ->count();
        
        $pendingCubicles = DB::table('cubicle_bookings')
            ->where('status', 'pending')
            ->count();
        
        $pendingInstruments = DB::table('instrument_bookings')
            ->where('status', 'pending')
            ->count();
        
        $pendingTools = DB::table('tool_bookings')
            ->where('status', 'pending')
            ->count();
        
        $totalPendingApprovals = $pendingCeciliaHall + $pendingMTL + $pendingCubicles + $pendingInstruments + $pendingTools;

        // Items under repair count (from assets table + cubicles)
        $assetsUnderRepair = DB::table('assets')
            ->whereIn('status', ['maintenance', 'disposed'])
            ->count();
        
        $cubiclesUnderRepair = DB::table('cubicle_info')
            ->whereIn('status', ['Under Repair', 'Maintenance'])
            ->count();
        
        $itemsUnderRepair = $assetsUnderRepair + $cubiclesUnderRepair;

        // Most borrowed instrument (from activity logs - instrument_usage table)
        $mostBorrowedInstrument = DB::table('instrument_usage')
            ->join('assets', 'instrument_usage.instrument_id', '=', 'assets.id')
            ->select('assets.name', 'assets.category', DB::raw('COUNT(*) as borrow_count'))
            ->groupBy('assets.id', 'assets.name', 'assets.category')
            ->orderByDesc('borrow_count')
            ->first();

        // Most used cubicle type (from activity logs - cubicle_usage table)
        $mostUsedCubicle = DB::table('cubicle_usage')
            ->join('cubicle_info', 'cubicle_usage.cubicle_id', '=', 'cubicle_info.cubicle_id')
            ->select('cubicle_info.cubicle_type', DB::raw('COUNT(*) as usage_count'))
            ->groupBy('cubicle_info.cubicle_type')
            ->orderByDesc('usage_count')
            ->first();

        return [
            'pendingApprovals' => $totalPendingApprovals ?? 0,
            'itemsUnderRepair' => $itemsUnderRepair ?? 0,
            'mostBorrowedInstrument' => [
                'count' => $mostBorrowedInstrument ? $mostBorrowedInstrument->borrow_count : 0,
                'name' => $mostBorrowedInstrument ? $mostBorrowedInstrument->category : 'N/A'
            ],
            'mostUsedCubicle' => [
                'count' => $mostUsedCubicle ? $mostUsedCubicle->usage_count : 0,
                'type' => $mostUsedCubicle ? $mostUsedCubicle->cubicle_type : 'N/A'
            ],
        ];
    }

    private function getUtilizationByYearLevel($semesterValue = null)
    {
        // Get semester date range if provided
        $startDate = null;
        $endDate = null;
        
        if ($semesterValue) {
            $semesters = $this->getAvailableSemesters();
            $selectedSemester = collect($semesters)->firstWhere('value', $semesterValue);
            
            if ($selectedSemester) {
                $startDate = $selectedSemester['start_date'];
                $endDate = $selectedSemester['end_date'];
            }
        }
        
        // Get usage by year level from student table (from activity logs - all usage tables combined)
        // Separate regular cubicles from MTL cubicle
        $regularCubicleQuery = DB::table('cubicle_usage')
            ->join('student', 'cubicle_usage.student_id', '=', 'student.student_id')
            ->join('cubicle_info', 'cubicle_usage.cubicle_id', '=', 'cubicle_info.cubicle_id')
            ->where('cubicle_info.cubicle_type', '!=', 'MTL');
        
        if ($startDate && $endDate) {
            $regularCubicleQuery->whereBetween('cubicle_usage.usage_date', [$startDate, $endDate]);
        }
        
        $regularCubicleUsage = $regularCubicleQuery
            ->select('student.year', DB::raw('COUNT(*) as count'))
            ->groupBy('student.year')
            ->get()
            ->keyBy('year');

        $mtlCubicleQuery = DB::table('cubicle_usage')
            ->join('student', 'cubicle_usage.student_id', '=', 'student.student_id')
            ->join('cubicle_info', 'cubicle_usage.cubicle_id', '=', 'cubicle_info.cubicle_id')
            ->where('cubicle_info.cubicle_type', '=', 'MTL');
        
        if ($startDate && $endDate) {
            $mtlCubicleQuery->whereBetween('cubicle_usage.usage_date', [$startDate, $endDate]);
        }
        
        $mtlCubicleUsage = $mtlCubicleQuery
            ->select('student.year', DB::raw('COUNT(*) as count'))
            ->groupBy('student.year')
            ->get()
            ->keyBy('year');

        $instrumentQuery = DB::table('instrument_usage')
            ->join('student', 'instrument_usage.student_id', '=', 'student.student_id');
        
        if ($startDate && $endDate) {
            $instrumentQuery->whereBetween('instrument_usage.usage_date', [$startDate, $endDate]);
        }
        
        $instrumentUsage = $instrumentQuery
            ->select('student.year', DB::raw('COUNT(*) as count'))
            ->groupBy('student.year')
            ->get()
            ->keyBy('year');

        $toolQuery = DB::table('tool_usage')
            ->join('student', 'tool_usage.student_id', '=', 'student.student_id');
        
        if ($startDate && $endDate) {
            $toolQuery->whereBetween('tool_usage.usage_date', [$startDate, $endDate]);
        }
        
        $toolUsage = $toolQuery
            ->select('student.year', DB::raw('COUNT(*) as count'))
            ->groupBy('student.year')
            ->get()
            ->keyBy('year');

        // Ensure all year levels are included (1-4) even if no data
        $utilization = collect([1, 2, 3, 4])->map(function($year) use ($regularCubicleUsage, $mtlCubicleUsage, $instrumentUsage, $toolUsage) {
            $cubicles = isset($regularCubicleUsage[$year]) ? $regularCubicleUsage[$year]->count : 0;
            $mtlCubicle = isset($mtlCubicleUsage[$year]) ? $mtlCubicleUsage[$year]->count : 0;
            $instruments = isset($instrumentUsage[$year]) ? $instrumentUsage[$year]->count : 0;
            $tools = isset($toolUsage[$year]) ? $toolUsage[$year]->count : 0;
            $total = $cubicles + $mtlCubicle + $instruments + $tools;
            
            // Format year level with proper suffix
            $yearSuffix = ['1st', '2nd', '3rd', '4th'];
            
            return [
                'year' => $yearSuffix[$year - 1] . ' year',
                'cubicles' => $cubicles,
                'mtlCubicle' => $mtlCubicle,
                'instruments' => $instruments,
                'tools' => $tools,
                'total' => $total
            ];
        });

        return $utilization->values();
    }

    private function getCubicleUsage()
    {
        // Get total bookings per cubicle type (from activity logs - cubicle_usage table)
        $usage = DB::table('cubicle_usage')
            ->join('cubicle_info', 'cubicle_usage.cubicle_id', '=', 'cubicle_info.cubicle_id')
            ->select('cubicle_info.cubicle_type', DB::raw('COUNT(*) as sessions'))
            ->groupBy('cubicle_info.cubicle_type')
            ->get();

        return $usage->map(function($item) {
            return [
                'category' => $item->cubicle_type,
                'sessions' => $item->sessions
            ];
        });
    }

    private function getWeeklyUsageTrend()
    {
        // Get last 12 weeks of usage (from activity logs - all usage tables combined)
        $weeks = [];
        for ($i = 11; $i >= 0; $i--) {
            $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
            $weekEnd = Carbon::now()->subWeeks($i)->endOfWeek();
            
            // Count from all three usage tables
            $cubicleCount = DB::table('cubicle_usage')
                ->whereBetween('usage_date', [$weekStart, $weekEnd])
                ->count();
            
            $instrumentCount = DB::table('instrument_usage')
                ->whereBetween('usage_date', [$weekStart, $weekEnd])
                ->count();
            
            $toolCount = DB::table('tool_usage')
                ->whereBetween('usage_date', [$weekStart, $weekEnd])
                ->count();
            
            $totalCount = $cubicleCount + $instrumentCount + $toolCount;
            
            $weeks[] = [
                'week' => 'week ' . (12 - $i),
                'usage' => $totalCount
            ];
        }

        return $weeks;
    }

    private function getAssetConditions()
    {
        // Get assets that are under repair or decommissioned with descriptions
        $conditions = DB::table('assets')
            ->whereIn('status', ['maintenance', 'disposed'])
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(function($asset) {
                $statusMap = [
                    'maintenance' => 'Under Repair',
                    'disposed' => 'Decommissioned'
                ];
                
                return [
                    'name' => $asset->name . ' #' . $asset->asset_code,
                    'status' => $statusMap[$asset->status] ?? $asset->status,
                    'date' => Carbon::parse($asset->updated_at)->format('M d, Y'),
                    'description' => $asset->repair_description ?? $asset->description ?? 'No description provided.',
                    'repair_image' => $asset->repair_image ? asset('storage/' . $asset->repair_image) : null,
                    'statusClass' => $asset->status === 'maintenance' ? 'yellow' : 'red'
                ];
            });

        return $conditions;
    }

    private function getCombinedConditions()
    {
        $conditions = collect();

        // Get assets that are under repair or decommissioned
        $assetConditions = DB::table('assets')
            ->leftJoin('asset_disposals', 'assets.id', '=', 'asset_disposals.asset_id')
            ->select('assets.*', 'asset_disposals.disposal_reason')
            ->whereIn('assets.status', ['maintenance', 'disposed'])
            ->orderByDesc('assets.updated_at')
            ->limit(10)
            ->get()
            ->map(function($asset) {
                $statusMap = [
                    'maintenance' => 'Under Repair',
                    'disposed' => 'Decommissioned'
                ];
                
                // Create user-friendly description
                $description = '';
                if ($asset->status === 'maintenance') {
                    $description = !empty($asset->repair_description)
                        ? 'Issue: ' . $asset->repair_description
                        : 'Currently undergoing maintenance and repairs.';
                } else if ($asset->status === 'disposed') {
                    // disposal_reason is now from the joined asset_disposals table
                    $description = !empty($asset->disposal_reason)
                        ? 'Reason: ' . $asset->disposal_reason
                        : 'This equipment has been decommissioned and removed from inventory.';
                }
                
                return [
                    'id' => $asset->id,
                    'type' => 'asset',
                    'name' => $asset->name . ' #' . $asset->asset_code,
                    'status' => $statusMap[$asset->status] ?? $asset->status,
                    'date' => Carbon::parse($asset->updated_at)->format('M d, Y'),
                    'description' => $description,
                    'repair_image' => $asset->repair_image ? asset('storage/' . $asset->repair_image) : null,
                    'statusClass' => $asset->status === 'maintenance' ? 'yellow' : 'red',
                    'updated_at' => $asset->updated_at
                ];
            });

        // Get cubicles that are under maintenance or under repair (exclude Occupied)
        $cubicleConditions = DB::table('cubicle_info')
            ->whereIn('status', ['Under Repair', 'Maintenance'])
            ->limit(10)
            ->get()
            ->map(function($cubicle) {
                // Create more descriptive message
                $description = $cubicle->status === 'Under Repair'
                    ? 'This cubicle is currently under repair and unavailable for bookings.'
                    : 'This cubicle is undergoing scheduled maintenance.';
                    
                return [
                    'id' => $cubicle->id,
                    'type' => 'cubicle',
                    'name' => $cubicle->cubicle_type . ' Cubicle #' . $cubicle->cubicle_no,
                    'status' => $cubicle->status,
                    'date' => Carbon::now()->format('M d, Y'),
                    'description' => $description,
                    'repair_image' => null,
                    'statusClass' => 'yellow',
                    'updated_at' => Carbon::now()
                ];
            });

        // Combine both collections
        $conditions = $assetConditions->concat($cubicleConditions)
            ->sortByDesc('updated_at')
            ->take(10)
            ->values();

        return $conditions;
    }


    private function getAssetChartData()
    {
        // Count assets by category, filtering for music-related categories only
        $categoryCounts = DB::table('assets')
            ->select('category', DB::raw('COUNT(*) as count'))
            ->whereIn('category', ['Musical Instruments', 'Audio Visual Equipment', 'Computer Equipment', 'Equipment'])
            ->groupBy('category')
            ->get();

        $chartData = [];
        
        // Map category names to cleaner labels
        $categoryMap = [
            'Musical Instruments' => 'Instruments',
            'Audio Visual Equipment' => 'AV Equipment',
            'Computer Equipment' => 'Computers',
            'Equipment' => 'Other Equipment'
        ];
        
        foreach ($categoryCounts as $category) {
            $chartData[] = [
                'name' => $categoryMap[$category->category] ?? $category->category,
                'value' => $category->count
            ];
        }

        return $chartData;
    }

    private function getCeciliaHallBookings()
    {
        // Get recent Cecilia Hall bookings with their status (limited to 8)
        $bookings = DB::table('cecilia_hall_bookings')
            ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
            ->orderByDesc('date')
            ->limit(8)
            ->get()
            ->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'purpose' => $booking->purpose,
                    'date' => Carbon::parse($booking->date)->format('M d, Y'),
                    'time' => Carbon::parse($booking->start_time)->format('g:i A') . ' - ' . 
                             Carbon::parse($booking->end_time)->format('g:i A'),
                    'status' => $booking->status,
                    'student_name' => $booking->name,
                    'email' => $booking->email,
                    'booker_type' => $booking->booker_type,
                ];
            });

        return $bookings;
    }

    private function getMTLBookings()
    {
        // Get recent MTL bookings with their status (limited to 8)
        $bookings = DB::table('mtl_bookings')
            ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
            ->orderByDesc('date')
            ->limit(8)
            ->get()
            ->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'purpose' => $booking->purpose,
                    'date' => Carbon::parse($booking->date)->format('M d, Y'),
                    'time' => Carbon::parse($booking->start_time)->format('g:i A') . ' - ' . 
                             Carbon::parse($booking->end_time)->format('g:i A'),
                    'status' => $booking->status,
                    'student_name' => $booking->name,
                    'email' => $booking->email,
                ];
            });

        return $bookings;
    }

    private function getAvailableSemesters()
    {
        // System started in 1st Semester 2025-2026 (current school year)
        // Generate semesters from current academic year onwards
        $allSemesters = [];
        $currentYear = now()->year;
        $currentMonth = now()->month;
        
        // System start year (current academic year)
        $systemStartYear = 2025;
        
        // Determine current academic year
        // If we're in Jan-Jul, academic year started last year (Aug of previous year)
        // If we're in Aug-Dec, academic year started this year
        $currentAcademicYear = ($currentMonth >= 8) ? $currentYear : $currentYear - 1;
        
        // Calculate end year: only current academic year
        // When summer is done (Aug onwards), next academic year is automatically included
        $endYear = $currentAcademicYear;
        
        // Generate semesters from system start year to end year
        for ($academicYear = $systemStartYear; $academicYear <= $endYear; $academicYear++) {
            $nextYear = $academicYear + 1;
            
            // 1st Semester (Aug - Dec)
            $allSemesters[] = [
                'label' => "1st Semester {$academicYear}-{$nextYear}",
                'value' => "1st-{$academicYear}",
                'start_date' => "{$academicYear}-08-01",
                'end_date' => "{$academicYear}-12-31",
                'months' => 5,
                'sort_date' => "{$academicYear}-08-01"
            ];
            
            // 2nd Semester (Jan - May)
            $allSemesters[] = [
                'label' => "2nd Semester {$academicYear}-{$nextYear}",
                'value' => "2nd-{$academicYear}",
                'start_date' => "{$nextYear}-01-01",
                'end_date' => "{$nextYear}-05-31",
                'months' => 5,
                'sort_date' => "{$nextYear}-01-01"
            ];
            
            // Summer (Jun - Jul)
            $allSemesters[] = [
                'label' => "Summer {$nextYear}",
                'value' => "summer-{$nextYear}",
                'start_date' => "{$nextYear}-06-01",
                'end_date' => "{$nextYear}-07-31",
                'months' => 2,
                'sort_date' => "{$nextYear}-06-01"
            ];
        }
        
        // Filter out any semesters before August 2025 (system start date)
        $allSemesters = array_filter($allSemesters, function($semester) {
            return $semester['start_date'] >= '2025-08-01';
        });
        
        // Sort by date descending (newest first)
        usort($allSemesters, function($a, $b) {
            return strcmp($b['sort_date'], $a['sort_date']);
        });
        
        return $allSemesters;
    }

    private function getCurrentSemester()
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;
        
        // Determine current semester based on month
        if ($currentMonth >= 8 && $currentMonth <= 12) {
            // 1st Semester (Aug - Dec)
            return "1st-{$currentYear}";
        } elseif ($currentMonth >= 1 && $currentMonth <= 5) {
            // 2nd Semester (Jan - May)
            return "2nd-" . ($currentYear - 1);
        } else {
            // Summer (Jun - Jul)
            return "summer-{$currentYear}";
        }
    }

    private function getSemesterBookings($semesterValue)
    {
        // Find semester details
        $semesters = $this->getAvailableSemesters();
        $selectedSemester = collect($semesters)->firstWhere('value', $semesterValue);
        
        if (!$selectedSemester) {
            return [];
        }
        
        $startDate = $selectedSemester['start_date'];
        $endDate = $selectedSemester['end_date'];
        
        // Get cubicle bookings (uses booking_date)
        $cubicleBookings = DB::table('cubicle_bookings')
            ->select('booking_date as date', DB::raw('COUNT(*) as count'))
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->groupBy('booking_date')
            ->get()
            ->keyBy('date');
        
        // Get instrument bookings (uses booking_date)
        $instrumentBookings = DB::table('instrument_bookings')
            ->select('booking_date as date', DB::raw('COUNT(*) as count'))
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->groupBy('booking_date')
            ->get()
            ->keyBy('date');
        
        // Get tool bookings (uses booking_date)
        $toolBookings = DB::table('tool_bookings')
            ->select('booking_date as date', DB::raw('COUNT(*) as count'))
            ->whereBetween('booking_date', [$startDate, $endDate])
            ->groupBy('booking_date')
            ->get()
            ->keyBy('date');
        
        // Get Cecilia Hall bookings (uses date)
        $ceciliaBookings = DB::table('cecilia_hall_bookings')
            ->select('date', DB::raw('COUNT(*) as count'))
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('date')
            ->get()
            ->keyBy('date');
        
        // Combine all bookings by date
        $allDates = collect([$cubicleBookings, $instrumentBookings, $toolBookings, $ceciliaBookings])
            ->flatMap(function($bookings) {
                return $bookings->keys();
            })
            ->unique()
            ->sort()
            ->values();
        
        $bookingsByDate = [];
        foreach ($allDates as $date) {
            $cubicleCount = $cubicleBookings->has($date) ? $cubicleBookings->get($date)->count : 0;
            $instrumentCount = $instrumentBookings->has($date) ? $instrumentBookings->get($date)->count : 0;
            $toolCount = $toolBookings->has($date) ? $toolBookings->get($date)->count : 0;
            $ceciliaCount = $ceciliaBookings->has($date) ? $ceciliaBookings->get($date)->count : 0;
            
            $bookingsByDate[$date] = [
                'date' => $date,
                'cubicles' => $cubicleCount,
                'instruments' => $instrumentCount,
                'tools' => $toolCount,
                'cecilia' => $ceciliaCount,
                'total' => $cubicleCount + $instrumentCount + $toolCount + $ceciliaCount
            ];
        }
        
        return [
            'semester' => $selectedSemester,
            'bookings' => $bookingsByDate
        ];
    }
}