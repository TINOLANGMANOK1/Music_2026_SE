<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardChartController extends Controller
{
    public function getWeeklyUsage(Request $request)
    {
        $request->validate([
            'startDate' => 'required|date',
            'endDate' => 'required|date',
        ]);

        $startDate = $request->startDate;
        $endDate = $request->endDate;

        // Get cubicle usage from cubicle_usage table (activity log - historical data)
        $cubicleUsage = DB::table('cubicle_usage as cu')
            ->join('cubicle_info as ci', 'cu.cubicle_id', '=', 'ci.cubicle_id')
            ->select(DB::raw('DATE(cu.usage_date) as date'), 'ci.cubicle_type', DB::raw('count(DISTINCT cu.student_id) as count'))
            ->whereBetween('cu.usage_date', [$startDate, $endDate])
            ->groupBy('date', 'ci.cubicle_type')
            ->get();

        // Get instrument usage from instrument_usage table (activity log - historical data)
        $instrumentUsage = DB::table('instrument_usage as iu')
            ->select(DB::raw('DATE(iu.usage_date) as date'), DB::raw('count(DISTINCT iu.student_id) as count'))
            ->whereBetween('iu.usage_date', [$startDate, $endDate])
            ->groupBy('date')
            ->get();

        $data = [];
        $dates = [];
        for ($date = new \DateTime($startDate); $date <= new \DateTime($endDate); $date->modify('+1 day')) {
            $d = $date->format('Y-m-d');
            $dates[$d] = [
                'date' => $d,
                'cubicles' => 0,
                'instruments' => 0,
                'mtl' => 0,
            ];
        }

        foreach ($cubicleUsage as $usage) {
            if (isset($dates[$usage->date])) {
                if ($usage->cubicle_type === 'MTL') {
                    $dates[$usage->date]['mtl'] += $usage->count;
                } else {
                    $dates[$usage->date]['cubicles'] += $usage->count;
                }
            }
        }

        foreach ($instrumentUsage as $usage) {
            if (isset($dates[$usage->date])) {
                $dates[$usage->date]['instruments'] += $usage->count;
            }
        }

        return response()->json(array_values($dates));
    }

    public function getWeeklyToolUsage(Request $request)
    {
        $request->validate([
            'startDate' => 'required|date',
            'endDate' => 'required|date',
        ]);

        $startDate = $request->startDate;
        $endDate = $request->endDate;

        // Get tool usage from tool_usage table (activity log - historical data)
        // Group by category, excluding Musical Instruments and Audio Visual Equipment
        $toolUsage = DB::table('tool_usage as tu')
            ->join('assets as a', 'tu.tool_id', '=', 'a.id')
            ->select('a.category as item_type', DB::raw('count(tu.usage_id) as usage_count'))
            ->whereBetween('tu.usage_date', [$startDate, $endDate])
            ->whereNotIn('a.category', ['Musical Instruments', 'Audio Visual Equipment'])
            ->groupBy('a.category')
            ->get();

        return response()->json($toolUsage);
    }

    public function getWeeklyCubicleUsage(Request $request)
    {
        $request->validate([
            'startDate' => 'required|date',
            'endDate' => 'required|date',
        ]);

        $startDate = $request->startDate;
        $endDate = $request->endDate;

        // Get cubicle usage from cubicle_usage table grouped by cubicle type
        $usage = DB::table('cubicle_usage')
            ->join('cubicle_info', 'cubicle_usage.cubicle_id', '=', 'cubicle_info.cubicle_id')
            ->select('cubicle_info.cubicle_type', DB::raw('COUNT(*) as sessions'))
            ->whereBetween('cubicle_usage.usage_date', [$startDate, $endDate])
            ->groupBy('cubicle_info.cubicle_type')
            ->get()
            ->keyBy('cubicle_type');

        // Always return all cubicle types, even if there's no data
        $allCubicleTypes = ['Guitar', 'Piano', 'MTL'];
        $result = collect($allCubicleTypes)->map(function($type) use ($usage) {
            return [
                'category' => $type,
                'sessions' => isset($usage[$type]) ? $usage[$type]->sessions : 0
            ];
        });

        return response()->json($result->values());
    }
}
