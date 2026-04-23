<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inventory_id' => $this->inventory_id,
            'product_id' => $this->inventory?->product_id,
            'movement_type' => $this->type,
            'type' => $this->type,
            'quantity' => number_format((float) $this->quantity, 2, '.', ''),
            'note' => $this->notes,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'notes' => $this->notes,
            'date' => $this->movement_date ?? $this->created_at,
            'movement_date' => $this->movement_date ?? $this->created_at,
            'created_at' => $this->created_at,
        ];
    }
}
