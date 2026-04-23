<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'in:tea,masala'],
            'description' => ['nullable', 'string'],
            'unit' => ['sometimes', 'string', 'max:20'],
            'image' => ['nullable', 'string', 'max:255'],
            'price_per_unit' => ['sometimes', 'numeric', 'min:0'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,inactive'],
            'reorder_level' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
