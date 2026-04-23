<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with('inventory');

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($category = $request->string('category')->toString()) {
            $query->where('category', $category);
        }

        $products = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->success([
            'items' => ProductResource::collection($products->items()),
        ], 'Products fetched successfully.', meta: [
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $product = Product::query()->create([
                'name' => $request->string('name'),
                'category' => $request->string('category'),
                'description' => $request->input('description'),
                'unit' => $request->string('unit'),
                'image' => $request->input('image'),
                'price_per_unit' => $request->input('price', $request->input('price_per_unit')),
                'is_active' => $request->boolean('is_active', $request->input('status', 'active') === 'active'),
                'status' => $request->input('status', 'active'),
            ]);

            Inventory::query()->create([
                'product_id' => $product->id,
                'quantity' => $request->input('opening_stock', 0),
                'reorder_level' => $request->input('reorder_level', 10),
                'last_movement_at' => now(),
            ]);

            return $product;
        });

        return $this->success(new ProductResource($product), 'Product created successfully.', 201);
    }

    public function show(Product $product): JsonResponse
    {
        return $this->success(new ProductResource($product->load('inventory')));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $payload = $request->safe()->only(['name', 'category', 'description', 'unit', 'image', 'is_active', 'status']);
        if ($request->filled('price') || $request->filled('price_per_unit')) {
            $payload['price_per_unit'] = $request->input('price', $request->input('price_per_unit'));
        }

        if ($request->filled('status') && ! $request->has('is_active')) {
            $payload['is_active'] = $request->input('status') === 'active';
        }

        $product->update($payload);

        if ($request->has('reorder_level')) {
            $product->inventory?->update(['reorder_level' => $request->input('reorder_level')]);
        }

        return $this->success(new ProductResource($product->fresh()), 'Product updated successfully.');
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return $this->success(null, 'Product deleted successfully.');
    }

    public function restore(int $product): JsonResponse
    {
        $restored = Product::withTrashed()->findOrFail($product);
        $restored->restore();

        return $this->success(new ProductResource($restored), 'Product restored successfully.');
    }
}
