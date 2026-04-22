<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Vendor::query();

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        $vendors = $query->latest()->paginate($request->integer('per_page', 15));

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
        $vendor = Vendor::query()->create($request->validated());

        return $this->success(new VendorResource($vendor), 'Vendor created successfully.', 201);
    }

    public function show(Vendor $vendor): JsonResponse
    {
        return $this->success(new VendorResource($vendor));
    }

    public function update(UpdateVendorRequest $request, Vendor $vendor): JsonResponse
    {
        $vendor->update($request->validated());

        return $this->success(new VendorResource($vendor->fresh()), 'Vendor updated successfully.');
    }

    public function destroy(Vendor $vendor): JsonResponse
    {
        $vendor->delete();

        return $this->success(null, 'Vendor deleted successfully.');
    }
}
