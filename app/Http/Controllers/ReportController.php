<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReportController extends Controller
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
        $reports = $this->buildReportQuery($table, $filters)->get();

        return Inertia::render('Reports', [
            'reports' => $reports,
            'filters' => $filters
        ]);
    }

    public function exportData(Request $request)
    {
        $filters = $request->validate([
            'category' => ['required', 'string', Rule::in(['all', 'cubicles', 'instruments', 'tools'])],
            'type' => ['nullable', 'string'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date', 'after_or_equal:startDate'],
        ]);

        $tables = $filters['category'] === 'all'
            ? ['cubicles', 'instruments', 'tools']
            : [$filters['category']];
        $reportsByCategory = [];

        foreach ($tables as $table) {
            $category = ucfirst($table);
            $reportsByCategory[$category] = $this->buildReportQuery($table, $filters)->get();
        }

        return response()->json([
            'reportsByCategory' => $reportsByCategory,
        ]);
    }

    private function buildReportQuery(string $table, array $filters)
    {
        if ($table === 'cubicles') {
            $query = DB::table('cubicle_usage as cu')
                ->join('cubicle_info as ci', 'cu.cubicle_id', '=', 'ci.cubicle_id')
                ->select('ci.cubicle_type as item_type', DB::raw('count(*) as usage_count'))
                ->groupBy('ci.cubicle_type');

        } else if ($table === 'instruments') {
            // Use instrument_usage (activity log) with assets table
            // Only include Musical Instruments and Audio Visual Equipment
            $query = DB::table('instrument_usage as iu')
                ->join('assets as a', 'iu.instrument_id', '=', 'a.id')
                ->whereIn('a.category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->select('a.category as item_type', DB::raw('count(*) as usage_count'))
                ->groupBy('a.category');
        } else { // tools
            // Use tool_usage (activity log) with assets table
            // Exclude Musical Instruments and Audio Visual Equipment
            $query = DB::table('tool_usage as tu')
                ->join('assets as a', 'tu.tool_id', '=', 'a.id')
                ->whereNotIn('a.category', ['Musical Instruments', 'Audio Visual Equipment'])
                ->select('a.category as item_type', DB::raw('count(*) as usage_count'))
                ->groupBy('a.category');
        }

        if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
            if ($table === 'cubicles') {
                $query->whereBetween('cu.usage_date', [$filters['startDate'], $filters['endDate']]);
            } else if ($table === 'instruments') {
                $query->whereBetween('iu.usage_date', [$filters['startDate'], $filters['endDate']]);
            } else { // tools
                $query->whereBetween('tu.usage_date', [$filters['startDate'], $filters['endDate']]);
            }
        }

        if (!empty($filters['type']) && $filters['type'] !== 'All') {
            if ($table === 'cubicles') {
                $query->where('ci.cubicle_type', $filters['type']);
            } else { // instruments or tools
                $query->where('a.category', $filters['type']);
            }
        }

        return $query;
    }
}