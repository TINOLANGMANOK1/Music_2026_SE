<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ManageCubiclesController extends Controller
{
    /**
     * Display the manage cubicles page
     */
    public function index(Request $request)
    {
        $query = DB::table('cubicle_info');
        $openId = $request->input('openId');

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('cubicle_no', 'LIKE', "%{$search}%")
                  ->orWhere('cubicle_type', 'LIKE', "%{$search}%");
            });
        }

        // Apply type filter
        if ($request->has('type') && $request->type !== 'All') {
            $query->where('cubicle_type', $request->type);
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // If openId is provided, find which page the cubicle is on
        $shouldOpenModal = false;
        if ($openId) {
            $tempQuery = clone $query;
            $allCubicles = $tempQuery->orderBy('cubicle_type', 'asc')
                ->orderBy('cubicle_no', 'asc')
                ->get();
            $position = $allCubicles->search(function ($cubicle) use ($openId) {
                return $cubicle->cubicle_id == $openId;
            });
            if ($position !== false) {
                $perPage = 10;
                $correctPage = floor($position / $perPage) + 1;
                $request->merge(['page' => $correctPage]);
                $shouldOpenModal = true;
            }
        }

        $cubicles = $query
            ->orderBy('cubicle_type', 'asc')
            ->orderBy('cubicle_no', 'asc')
            ->paginate(10)
            ->withQueryString();
        
        // Remove openId from pagination links
        $cubicles->appends($request->except('openId'));

        // Get all cubicles (unfiltered and unpaginated) for the AddCubicleModal to calculate next number correctly
        $allCubicles = DB::table('cubicle_info')
            ->orderBy('cubicle_type', 'asc')
            ->orderBy('cubicle_no', 'asc')
            ->get();

        return Inertia::render('ManageCubicles', [
            'cubicles' => $cubicles,
            'allCubicles' => $allCubicles,
            'filters' => [
                'search' => $request->search ?? '',
                'type' => $request->type ?? 'All',
                'status' => $request->status ?? 'All',
            ],
            'openId' => $shouldOpenModal ? $openId : null,
        ]);
    }

    /**
     * Store a new cubicle
     */
    public function store(Request $request)
    {
        // First validate basic fields
        $request->validate([
            'cubicle_type' => 'required|string|max:45',
            'status' => 'required|string|in:Available,Maintenance,Instrument Under Repair',
        ]);

        // Auto-calculate the next cubicle number for this type
        $nextNumber = DB::table('cubicle_info')
            ->where('cubicle_type', $request->cubicle_type)
            ->max('cubicle_no') ?? 0;
        $nextNumber++;

        // Set cubicle_type_id based on type
        $typeId = $this->getCubicleTypeId($request->cubicle_type);

        DB::table('cubicle_info')->insert([
            'cubicle_type_id' => $typeId,
            'cubicle_type' => $request->cubicle_type,
            'cubicle_no' => $nextNumber,
            'status' => $request->status,
        ]);

        return back()->with('success', 'Cubicle added successfully!');
    }

    /**
     * Update an existing cubicle
     */
    public function update(Request $request, $id)
    {
        // Only allow updating status (cubicle_type and cubicle_no are fixed)
        $request->validate([
            'status' => 'required|string|in:Available,Maintenance,Instrument Under Repair',
        ]);

        DB::table('cubicle_info')
            ->where('cubicle_id', $id)
            ->update([
                'status' => $request->status,
            ]);

        return back()->with('success', 'Cubicle updated successfully!');
    }

    /**
     * Delete a cubicle
     */
    public function destroy($id)
    {
        // Check if cubicle has any active bookings
        $hasActiveBooking = DB::table('cubicle_bookings')
            ->where('cubicle_id', $id)
            ->where('status', 'Active')
            ->exists();

        if ($hasActiveBooking) {
            return back()->with('error', 'Cannot delete cubicle with active bookings.');
        }

        DB::table('cubicle_info')
            ->where('cubicle_id', $id)
            ->delete();

        return back()->with('success', 'Cubicle deleted successfully!');
    }

    /**
     * Get cubicle type ID based on type name
     */
    private function getCubicleTypeId($type)
    {
        // Map common types to IDs (you can adjust based on your system)
        $typeMap = [
            'Guitar' => 1,
            'Piano' => 2,
            'MTL' => 3,
            'Practice' => 4,
            'Storage' => 5,
            'Recording' => 6,
            'Rehearsal' => 7,
        ];

        return $typeMap[$type] ?? 1; // Default to 1 if not found
    }
}
