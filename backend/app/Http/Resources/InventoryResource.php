<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => new ProductResource($this->whenLoaded('product')),
            'quantity' => number_format((float) $this->quantity, 2, '.', ''),
            'reorder_level' => number_format((float) $this->reorder_level, 2, '.', ''),
            'is_low_stock' => $this->isLowStock(),
            'last_movement_at' => $this->last_movement_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
