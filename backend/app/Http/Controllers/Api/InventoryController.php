<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Inventory\AdjustInventoryRequest;
use App\Http\Resources\InventoryResource;
use App\Http\Resources\StockMovementResource;
use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::query()->with('product');

        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }

        $inventory = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->success([
            'items' => InventoryResource::collection($inventory->items()),
        ], 'Inventory fetched successfully.', meta: [
            'pagination' => [
                'current_page' => $inventory->currentPage(),
                'per_page' => $inventory->perPage(),
                'total' => $inventory->total(),
                'last_page' => $inventory->lastPage(),
            ],
        ]);
    }

    public function show(Inventory $inventory): JsonResponse
    {
        $inventory->load('product', 'movements');

        return $this->success([
            'inventory' => new InventoryResource($inventory),
            'movements' => StockMovementResource::collection($inventory->movements()->latest()->limit(30)->get()),
        ]);
    }

    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        $request->validate([
            'reorder_level' => ['required', 'numeric', 'min:0'],
        ]);

        $inventory->update([
            'reorder_level' => $request->input('reorder_level'),
        ]);

        return $this->success(new InventoryResource($inventory->fresh('product')), 'Inventory threshold updated.');
    }

    public function adjust(AdjustInventoryRequest $request): JsonResponse
    {
        $inventory = DB::transaction(function () use ($request) {
            $inventory = Inventory::query()->firstOrCreate(
                ['product_id' => $request->integer('product_id')],
                ['quantity' => 0, 'reorder_level' => 10]
            );

            $nextQuantity = (float) $inventory->quantity + (float) $request->input('quantity');
            if ($nextQuantity < 0) {
                abort(422, 'Cannot reduce stock below zero.');
            }

            $inventory->update([
                'quantity' => $nextQuantity,
                'last_movement_at' => now(),
            ]);

            StockMovement::query()->create([
                'inventory_id' => $inventory->id,
                'type' => $request->string('type'),
                'quantity' => abs((float) $request->input('quantity')),
                'notes' => $request->input('notes'),
                'created_by' => $request->user()?->id,
            ]);

            return $inventory;
        });

        return $this->success(new InventoryResource($inventory->load('product')), 'Inventory adjusted successfully.');
    }
}
