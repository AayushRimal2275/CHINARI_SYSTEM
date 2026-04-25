<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'category' => ['required', 'in:tea,masala'],
            'description' => ['nullable', 'string'],
            'unit' => ['required', 'string', 'max:20'],
            'image' => ['nullable', 'string', 'max:255'],
            'price_per_unit' => ['nullable', 'numeric', 'min:0', 'required_without:price'],
            'price' => ['nullable', 'numeric', 'min:0', 'required_without:price_per_unit'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,inactive'],
            'reorder_level' => ['sometimes', 'numeric', 'min:0'],
            'opening_stock' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
