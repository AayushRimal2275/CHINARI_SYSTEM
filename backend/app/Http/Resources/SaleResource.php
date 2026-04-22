<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_number' => $this->sale_number,
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product?->name,
                        'quantity' => number_format((float) $item->quantity, 2, '.', ''),
                        'price_per_unit' => number_format((float) $item->price_per_unit, 2, '.', ''),
                        'line_total' => number_format((float) $item->line_total, 2, '.', ''),
                    ];
                });
            }),
            'total_amount' => number_format((float) $this->total_amount, 2, '.', ''),
            'paid_amount' => number_format((float) $this->paid_amount, 2, '.', ''),
            'payment_status' => $this->payment_status,
            'sale_date' => $this->sale_date,
            'created_at' => $this->created_at,
        ];
    }
}
