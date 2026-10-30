<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetDisposal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        // Only show assets that are NOT disposed
        $query = Asset::query()->where('status', '!=', 'disposed');
        $openId = $request->input('openId');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('asset_code', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->input('category') !== 'All') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status') && $request->input('status') !== 'All') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('office') && $request->input('office') !== 'All') {
            $query->where('office', $request->input('office'));
        }

        if ($request->filled('is_borrowable') && $request->input('is_borrowable') !== 'All') {
            $query->where('is_borrowable', $request->input('is_borrowable') === '1');
        }

        // If openId is provided, find which page the asset is on
        $shouldOpenModal = false;
        if ($openId) {
            $allAssets = $query->get();
            $position = $allAssets->search(function ($asset) use ($openId) {
                return $asset->id == $openId;
            });
            if ($position !== false) {
                $perPage = 10;
                $correctPage = floor($position / $perPage) + 1;
                $request->merge(['page' => $correctPage]);
                $shouldOpenModal = true;
            }
        }

        // Exclude openId from pagination links
        $assets = $query->paginate(10)->withQueryString()->through(function ($asset) {
            return $asset;
        });
        
        // Remove openId from the appended query string
        $assets->appends($request->except('openId'));

        // Fetch disposal history with asset and user information
        $disposals = AssetDisposal::join('assets', 'asset_disposals.asset_id', '=', 'assets.id')
            ->join('users', 'asset_disposals.disposed_by', '=', 'users.id')
            ->select(
                'asset_disposals.*',
                'assets.asset_code',
                'assets.name as asset_name',
                'assets.category as asset_category',
                'assets.office as asset_office',
                'users.name as disposed_by_name'
            )
            ->orderBy('asset_disposals.disposed_at', 'desc')
            ->get();

        return Inertia::render('Inventory', [
            'assets' => $assets,
            'disposals' => $disposals,
            'filters' => $request->only(['search', 'category', 'status', 'office', 'is_borrowable']),
            'categories' => Asset::where('status', '!=', 'disposed')->distinct()->pluck('category'),
            'statuses' => Asset::where('status', '!=', 'disposed')->distinct()->pluck('status'),
            'offices' => Asset::where('status', '!=', 'disposed')->distinct()->pluck('office'),
            'openId' => $shouldOpenModal ? $openId : null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_code' => 'required|string|unique:assets,asset_code',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'office' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_acquired' => 'nullable|date',
            'value' => 'nullable|numeric',
            'is_borrowable' => 'required|boolean',
            'status' => 'required|string|max:255',
        ]);

        Asset::create($validated);

        return redirect()->route('inventory.index');
    }

    public function update(Request $request, $inventory)
    {
        $asset = Asset::findOrFail($inventory);
        
        // Convert is_borrowable to boolean if it's a string
        if ($request->has('is_borrowable')) {
            $request->merge([
                'is_borrowable' => filter_var($request->input('is_borrowable'), FILTER_VALIDATE_BOOLEAN)
            ]);
        }
        
        $validated = $request->validate([
            'asset_code' => 'required|string|unique:assets,asset_code,' . $asset->id,
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'office' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_acquired' => 'nullable|date',
            'value' => 'nullable|numeric',
            'is_borrowable' => 'required|boolean',
            'status' => 'required|string|max:255',
            'repair_description' => 'nullable|string',
            'repair_image' => 'nullable|image|max:5120', // 5MB max
        ]);

        // Handle repair image upload
        if ($request->hasFile('repair_image')) {
            // Delete old image if exists
            if ($asset->repair_image && \Storage::disk('public')->exists($asset->repair_image)) {
                \Storage::disk('public')->delete($asset->repair_image);
            }
            
            $imagePath = $request->file('repair_image')->store('repair_images', 'public');
            $validated['repair_image'] = $imagePath;
        }

        // If returning from repair (status changed to available and repair fields are null)
        if ($validated['status'] === 'available' && 
            $request->has('repair_description') && 
            $request->input('repair_description') === null) {
            
            // Delete repair image if exists
            if ($asset->repair_image && \Storage::disk('public')->exists($asset->repair_image)) {
                \Storage::disk('public')->delete($asset->repair_image);
            }
            
            // Clear repair fields
            $validated['repair_description'] = null;
            $validated['repair_image'] = null;
        }

        $asset->update($validated);

        return redirect()->route('inventory.index');
    }

    public function destroy($inventory)
    {
        $asset = Asset::findOrFail($inventory);
        $asset->delete();

        return redirect()->route('inventory.index');
    }

    public function dispose(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'disposal_reason' => 'required|string',
            'disposal_document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB max
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        // Upload the disposal document
        $documentPath = null;
        if ($request->hasFile('disposal_document')) {
            $documentPath = $request->file('disposal_document')->store('disposal_documents', 'public');
        }

        // Create disposal record
        AssetDisposal::create([
            'asset_id' => $asset->id,
            'disposal_reason' => $validated['disposal_reason'],
            'disposal_document' => $documentPath,
            'disposed_at' => now(),
            'disposed_by' => auth()->id(),
        ]);

        // Update asset status to disposed
        $asset->update(['status' => 'disposed']);

        return redirect()->route('inventory.index');
    }
}
