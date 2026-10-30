<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\Tool;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ManageEquipmentController extends Controller
{
    public function index(Request $request)
    {
        $category = $request->input('category', 'instrument');
        $search = $request->input('search');
        $type = $request->input('type');

        $instrumentQuery = DB::table('instrument_info')
            ->select(
                'instrument_id as id',
                'instrument_no as no',
                'instrument_type as type',
                'status',
                'barcode',
                'brand',
                'description',
                'image_url',
                DB::raw('"instrument" as item_category')
            );

        $toolQuery = DB::table('tools_info')
            ->select(
                'tool_id as id',
                'tool_no as no',
                'tool_type as type',
                'status',
                'barcode',
                'brand',
                'description',
                'image_url',
                DB::raw('"tool" as item_category')
            );

        if ($category === 'instrument') {
            $baseQuery = $instrumentQuery;
        } elseif ($category === 'tool') {
            $baseQuery = $toolQuery;
        } else {
            $baseQuery = $instrumentQuery->union($toolQuery);
        }

        $query = DB::query()->fromSub($baseQuery, 'inventory');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($type && $type !== 'All') {
            $query->where('type', $type);
        }

        $inventory = $query->paginate(10)->withQueryString();

        $instrumentTypes = DB::table('instrument_info')->distinct()->pluck('instrument_type');
        $toolTypes = DB::table('tools_info')->distinct()->pluck('tool_type');

        return Inertia::render('ManageEquipment', [
            'inventory' => $inventory,
            'filters' => $request->only(['search', 'category', 'type']),
            'instrumentTypes' => $instrumentTypes,
            'toolTypes' => $toolTypes,
        ]);
    }    public function getGuitar2Details()
    {
        $guitar2 = DB::table('instrument_info')->where('instrument_type', 'Guitar')->where('instrument_no', 2)->first();
        return response()->json($guitar2);
    }
}
