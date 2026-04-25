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

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
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
            'movements' => StockMovementResource::collection($inventory->movements()->with('inventory')->latest()->limit(30)->get()),
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

            $movementType = $request->input('movement_type', $request->input('type'));
            $amount = (float) $request->input('quantity');
            $signedQuantity = $movementType === 'out' ? -1 * $amount : $amount;
            if ($movementType === 'adjustment' && $request->filled('type')) {
                $signedQuantity = (float) $request->input('quantity');
            }

            $nextQuantity = (float) $inventory->quantity + $signedQuantity;
            if ($nextQuantity < 0) {
                abort(422, 'Cannot reduce stock below zero.');
            }

            $inventory->update([
                'quantity' => $nextQuantity,
                'last_movement_at' => now(),
            ]);

            StockMovement::query()->create([
                'inventory_id' => $inventory->id,
                'type' => $movementType,
                'quantity' => abs($signedQuantity),
                'notes' => $request->input('note', $request->input('notes')),
                'movement_date' => $request->input('date', now()),
                'created_by' => $request->user()?->id,
            ]);

            return $inventory;
        });

        return $this->success(new InventoryResource($inventory->load('product')), 'Inventory adjusted successfully.');
    }
}
