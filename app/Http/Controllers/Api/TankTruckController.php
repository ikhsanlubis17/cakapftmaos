<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TankTruck;
use App\Models\Apar;

class TankTruckController extends Controller
{
    /**
     * Display a listing of tank trucks
     */
    public function index(Request $request)
    {
        $query = TankTruck::with(['apars.aparType']);

        if ($request->has('search')) {
            $query->where('plate_number', 'like', '%' . $request->search . '%')
                  ->orWhere('driver_name', 'like', '%' . $request->search . '%');
        }

        $tankTrucks = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($tankTrucks);
    }

    /**
     * Store a newly created tank truck
     */
    public function store(Request $request)
    {
        $request->validate([
            'plate_number' => 'required|string|unique:tank_trucks,plate_number',
            'driver_name' => 'required|string',
            'driver_phone' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $tankTruck = TankTruck::create($request->all());

        return response()->json([
            'message' => 'Mobil tangki berhasil ditambahkan',
            'tank_truck' => $tankTruck->load('apars.aparType')
        ], 201);
    }

    /**
     * Display the specified tank truck
     */
    public function show(TankTruck $tankTruck)
    {
        return response()->json($tankTruck->load(['apars.aparType', 'apars.inspections']));
    }

    /**
     * Update the specified tank truck
     */
    public function update(Request $request, TankTruck $tankTruck)
    {
        $request->validate([
            'plate_number' => 'required|string|unique:tank_trucks,plate_number,' . $tankTruck->id,
            'driver_name' => 'required|string',
            'driver_phone' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $tankTruck->update($request->all());

        return response()->json([
            'message' => 'Mobil tangki berhasil diperbarui',
            'tank_truck' => $tankTruck->load('apars.aparType')
        ]);
    }

    /**
     * Remove the specified tank truck
     */
    public function destroy(TankTruck $tankTruck)
    {
        // Check if tank truck has APARs
        if ($tankTruck->apars()->count() > 0) {
            return response()->json([
                'message' => 'Tidak dapat menghapus mobil tangki yang masih memiliki APAR'
            ], 422);
        }

        $tankTruck->delete();

        return response()->json([
            'message' => 'Mobil tangki berhasil dihapus'
        ]);
    }

    /**
     * Get APARs assigned to a tank truck
     */
    public function apars(TankTruck $tankTruck)
    {
        $apars = $tankTruck->apars()->with(['aparType', 'inspections' => function ($query) {
            $query->latest();
        }])->get();

        return response()->json($apars);
    }

    /**
     * Assign APAR to tank truck
     */
    public function assignApar(Request $request, TankTruck $tankTruck)
    {
        $request->validate([
            'apar_id' => 'required|exists:apars,id'
        ]);

        $apar = Apar::findOrFail($request->apar_id);

        // Check if APAR is already assigned to another tank truck
        if ($apar->tank_truck_id && $apar->tank_truck_id !== $tankTruck->id) {
            return response()->json([
                'message' => 'APAR sudah ditugaskan ke mobil tangki lain'
            ], 422);
        }

        $apar->update(['tank_truck_id' => $tankTruck->id]);

        return response()->json([
            'message' => 'APAR berhasil ditugaskan ke mobil tangki',
            'apar' => $apar->load(['tankTruck', 'aparType'])
        ]);
    }

    /**
     * Remove APAR from tank truck
     */
    public function removeApar(Request $request, TankTruck $tankTruck)
    {
        $request->validate([
            'apar_id' => 'required|exists:apars,id'
        ]);

        $apar = Apar::where('tank_truck_id', $tankTruck->id)
                   ->where('id', $request->apar_id)
                   ->firstOrFail();

        $apar->update(['tank_truck_id' => null]);

        return response()->json([
            'message' => 'APAR berhasil dihapus dari mobil tangki',
            'apar' => $apar->load('aparType')
        ]);
    }

    /**
     * Get inspection history for tank truck
     */
    public function inspections(TankTruck $tankTruck)
    {
        $inspections = $tankTruck->apars()
            ->with(['inspections' => function ($query) {
                $query->with('user')->latest();
            }])
            ->get()
            ->pluck('inspections')
            ->flatten()
            ->sortByDesc('created_at')
            ->values();

        return response()->json($inspections);
    }
} 