<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $sales = Sale::query()
            ->with('vendor')
            ->latest('sale_date')
            ->paginate($request->integer('per_page', 15));

        return $this->success([
            'items' => SaleResource::collection($sales->items()),
        ], 'Sales fetched successfully.', meta: [
            'pagination' => [
                'current_page' => $sales->currentPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
                'last_page' => $sales->lastPage(),
            ],
        ]);
    }

    public function show(Sale $sale): JsonResponse
    {
        return $this->success(new SaleResource($sale->load(['vendor', 'items.product', 'payments'])));
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = DB::transaction(function () use ($request) {
            $sale = Sale::query()->create([
                'vendor_id' => $request->integer('vendor_id'),
                'sale_number' => sprintf('SAL-%s', now()->format('YmdHisv')),
                'total_amount' => 0,
                'paid_amount' => 0,
                'payment_status' => 'unpaid',
                'sale_date' => $request->input('sale_date', now()),
            ]);

            $total = 0;

            foreach ($request->validated('items') as $line) {
                $inventory = Inventory::query()->where('product_id', $line['product_id'])->lockForUpdate()->first();

                if (! $inventory || (float) $inventory->quantity < (float) $line['quantity']) {
                    abort(422, 'Insufficient stock for one or more products.');
                }

                $price = array_key_exists('price_per_unit', $line)
                    ? (float) $line['price_per_unit']
                    : (float) $inventory->product->price_per_unit;

                $lineTotal = $price * (float) $line['quantity'];
                $total += $lineTotal;

                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $line['product_id'],
                    'quantity' => $line['quantity'],
                    'price_per_unit' => $price,
                    'line_total' => $lineTotal,
                ]);

                $inventory->update([
                    'quantity' => (float) $inventory->quantity - (float) $line['quantity'],
                    'last_movement_at' => now(),
                ]);

                StockMovement::query()->create([
                    'inventory_id' => $inventory->id,
                    'type' => 'out',
                    'quantity' => (float) $line['quantity'],
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'notes' => 'Auto-deducted from sale creation.',
                    'created_by' => $request->user()?->id,
                ]);
            }

            $sale->update(['total_amount' => $total]);

            return $sale;
        });

        return $this->success(new SaleResource($sale->load(['vendor', 'items.product'])), 'Sale created successfully.', 201);
    }
}
