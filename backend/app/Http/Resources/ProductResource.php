<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'description' => $this->description,
            'unit' => $this->unit,
            'image' => $this->image,
            'price' => number_format((float) $this->price_per_unit, 2, '.', ''),
            'price_per_unit' => number_format((float) $this->price_per_unit, 2, '.', ''),
            'status' => $this->status ?? ((bool) $this->is_active ? 'active' : 'inactive'),
            'is_active' => (bool) $this->is_active,
            'deleted_at' => $this->deleted_at,
            'inventory' => new InventoryResource($this->whenLoaded('inventory')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
