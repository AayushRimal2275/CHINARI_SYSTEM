<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Vendor::query();

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $vendors = $query->with('products')->latest()->paginate($request->integer('per_page', 15));

        return $this->success([
            'items' => VendorResource::collection($vendors->items()),
        ], 'Vendors fetched successfully.', meta: [
            'pagination' => [
                'current_page' => $vendors->currentPage(),
                'per_page' => $vendors->perPage(),
                'total' => $vendors->total(),
                'last_page' => $vendors->lastPage(),
            ],
        ]);
    }

    public function store(StoreVendorRequest $request): JsonResponse
    {
        $vendor = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $productIds = $data['product_ids'] ?? [];
            unset($data['product_ids']);

            $vendor = Vendor::query()->create($data);
            $vendor->products()->sync($productIds);

            return $vendor;
        });

        return $this->success(new VendorResource($vendor->load('products')), 'Vendor created successfully.', 201);
    }

    public function show(Vendor $vendor): JsonResponse
    {
        return $this->success(new VendorResource($vendor->load('products')));
    }

    public function update(UpdateVendorRequest $request, Vendor $vendor): JsonResponse
    {
        DB::transaction(function () use ($request, $vendor): void {
            $data = $request->validated();
            $productIds = $data['product_ids'] ?? null;
            unset($data['product_ids']);

            $vendor->update($data);
            if (is_array($productIds)) {
                $vendor->products()->sync($productIds);
            }
        });

        return $this->success(new VendorResource($vendor->fresh()->load('products')), 'Vendor updated successfully.');
    }

    public function destroy(Vendor $vendor): JsonResponse
    {
        $vendor->delete();

        return $this->success(null, 'Vendor deleted successfully.');
    }
}
