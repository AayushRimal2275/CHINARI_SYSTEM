<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class AdjustInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'type' => ['nullable', 'in:in,out,adjustment', 'required_without:movement_type'],
            'movement_type' => ['nullable', 'in:in,out,adjustment', 'required_without:type'],
            'notes' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
        ];
    }
}
