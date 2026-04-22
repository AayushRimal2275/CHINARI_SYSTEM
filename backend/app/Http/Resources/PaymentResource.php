<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'sale_id' => $this->sale_id,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'payment_date' => $this->payment_date,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
