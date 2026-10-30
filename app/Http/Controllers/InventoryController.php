<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\Tool;
use Illuminate\Http\Request;
use Inertia\Inertia;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $category = $request->input('category', 'instrument');
        $search = $request->input('search');
        $type = $request->input('type');

        $instrumentQuery = DB::table('instrument_info as i')
            ->leftJoin('instrument_bookings as ib', function ($join) {
                $join->on('i.instrument_id', '=', 'ib.instrument_id')
                    ->where('ib.status', '=', 'Active');
            })
            ->leftJoin('student as s', 'ib.student_id', '=', 's.student_id')
            ->select(
                'i.instrument_id as id',
                'i.instrument_no as no',
                'i.instrument_type as type',
                'i.status',
                'i.barcode',
                'i.brand',
                'i.description',
                'i.image_url',
                's.first_name',
                's.last_name',
                's.year',
                's.sec',
                'ib.booking_date',
                'ib.time_in',
                's.rfid_uid',
                DB::raw('"instrument" as item_category')
            );

        $toolQuery = DB::table('tools_info as t')
            ->leftJoin('tool_bookings as tb', function ($join) {
                $join->on('t.tool_id', '=', 'tb.tool_id')
                    ->where('tb.status', '=', 'Active');
            })
            ->leftJoin('student as s', 'tb.student_id', '=', 's.student_id')
            ->select(
                't.tool_id as id',
                't.tool_no as no',
                't.tool_type as type',
                't.status',
                't.barcode',
                't.brand',
                't.description',
                't.image_url',
                's.first_name',
                's.last_name',
                's.year',
                's.sec',
                'tb.booking_date',
                'tb.time_in',
                's.rfid_uid',
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
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($type && $type !== 'All') {
            $query->where('type', $type);
        }

        $inventory = $query->paginate(10)->withQueryString();

        $instrumentTypes = DB::table('instrument_info')->distinct()->pluck('instrument_type');
        $toolTypes = DB::table('tools_info')->distinct()->pluck('tool_type');

        $total = 0;
        if ($category === 'instrument') {
            $total = DB::table('instrument_info')->count();
        } elseif ($category === 'tool') {
            $total = DB::table('tools_info')->count();
        } else {
            $total = DB::table('instrument_info')->count() + DB::table('tools_info')->count();
        }

        $counts = [];
        if ($category === 'instrument') {
            $counts = DB::table('instrument_info')->select('status', DB::raw('count(*) as count'))->groupBy('status')->pluck('count', 'status')->all();
        } elseif ($category === 'tool') {
            $counts = DB::table('tools_info')->select('status', DB::raw('count(*) as count'))->groupBy('status')->pluck('count', 'status')->all();
        } else {
            $instrumentCounts = DB::table('instrument_info')->select('status', DB::raw('count(*) as count'))->groupBy('status')->pluck('count', 'status')->all();
            $toolCounts = DB::table('tools_info')->select('status', DB::raw('count(*) as count'))->groupBy('status')->pluck('count', 'status')->all();
            $counts = collect($instrumentCounts)->merge($toolCounts)->all();
        }

        return Inertia::render('Inventory', [
            'inventory' => $inventory,
            'filters' => $request->only(['search', 'category', 'type']),
            'instrumentTypes' => $instrumentTypes,
            'toolTypes' => $toolTypes,
            'counts' => $counts,
            'total' => $total,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'item_category' => 'required|string|in:instrument,tool',
            'brand' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'barcode' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ];

        if ($request->input('item_category') === 'instrument') {
            $rules['instrument_type'] = 'required|string';
        } else {
            $rules['tool_type'] = 'required|string';
        }

        $validatedData = $request->validate($rules);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('uploads', 'public');
            $imagePath = Storage::url($path);
        }

        if ($validatedData['item_category'] === 'instrument') {
            $maxId = Instrument::max('instrument_id');
            $maxNo = Instrument::where('instrument_type', $validatedData['instrument_type'])->max('instrument_no');
            $nextNo = $maxNo ? $maxNo + 1 : 1;

            Instrument::create([
                'instrument_id' => $maxId + 1,
                'instrument_type_id' => 1, // Placeholder value
                'instrument_type' => $validatedData['instrument_type'],
                'instrument_no' => $nextNo,
                'brand' => $validatedData['brand'],
                'description' => $validatedData['description'],
                'barcode' => $validatedData['barcode'],
                'image_url' => $imagePath,
                'status' => 'Available', // Default status
            ]);
        } else {
            $maxId = Tool::max('tool_id');
            $maxNo = Tool::where('tool_type', $validatedData['tool_type'])->max('tool_no');
            $nextNo = $maxNo ? $maxNo + 1 : 1;

            Tool::create([
                'tool_id' => $maxId + 1,
                'tool_type' => $validatedData['tool_type'],
                'tool_no' => $nextNo,
                'brand' => $validatedData['brand'],
                'description' => $validatedData['description'],
                'barcode' => $validatedData['barcode'],
                'image_url' => $imagePath,
                'status' => 'Available', // Default status
            ]);
        }

        return redirect()->route('inventory.index');
    }

    public function update(Request $request, $id)
    {
        $rules = [
            'item_category' => 'required|string|in:instrument,tool',
            'instrument_no' => 'required|string',
            'brand' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'barcode' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ];

        if ($request->input('item_category') === 'instrument') {
            $rules['instrument_type'] = 'required|string';
        } else {
            $rules['tool_type'] = 'required|string';
        }

        $validatedData = $request->validate($rules);

        if ($validatedData['item_category'] === 'instrument') {
            $item = Instrument::findOrFail($id);
            $instrumentData = $request->only(['instrument_type', 'instrument_no', 'status', 'brand', 'description', 'barcode', 'instrument_type_id']);
            if ($request->hasFile('image')) {
                if ($item->image_url) {
                    Storage::delete(str_replace('/storage', 'public', $item->image_url));
                }
                $path = $request->file('image')->store('public/uploads');
                $instrumentData['image_url'] = Storage::url($path);
            }
            $item->update($instrumentData);
        } else {
            $item = Tool::findOrFail($id);
            $toolData = $request->only(['tool_type', 'status', 'brand', 'description', 'barcode']);
            $toolData['tool_no'] = $request->instrument_no;
            if ($request->hasFile('image')) {
                if ($item->image_url) {
                    Storage::delete(str_replace('/storage', 'public', $item->image_url));
                }
                $path = $request->file('image')->store('public/uploads');
                $toolData['image_url'] = Storage::url($path);
            }
            $item->update($toolData);
        }

        return redirect()->route('inventory.index');
    }

    public function destroy($id, Request $request)
    {
        $request->validate([
            'item_category' => 'required|string|in:instrument,tool',
        ]);

        if ($request->item_category === 'instrument') {
            $item = Instrument::findOrFail($id);
        }
        else {
            $item = Tool::findOrFail($id);
        }

        $item->delete();

        return redirect()->route('inventory.index');
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Available,Borrowed,Under Repair,Decommissioned',
            'item_category' => 'required|string|in:instrument,tool',
        ]);

        if ($request->item_category === 'instrument') {
            $item = Instrument::findOrFail($id);
        } else {
            $item = Tool::findOrFail($id);
        }

        $item->status = $request->status;
        $item->save();

        return redirect()->route('manage-equipment');
    }

    public function getNextNumber(Request $request)
    {
        $request->validate([
            'item_category' => 'required|string|in:instrument,tool',
            'type' => 'required|string',
        ]);

        $category = $request->input('item_category');
        $type = $request->input('type');
        $nextNo = 1;

        if ($category === 'instrument') {
            $maxNo = Instrument::where('instrument_type', $type)->max('instrument_no');
            $nextNo = $maxNo ? $maxNo + 1 : 1;
        } else if ($category === 'tool') {
            $maxNo = Tool::where('tool_type', $type)->max('tool_no');
            $nextNo = $maxNo ? $maxNo + 1 : 1;
        }

        return response()->json(['next_number' => $nextNo]);
    }
}