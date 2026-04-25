<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'sale_id' => ['required', 'exists:sales,id'],
            'amount' => ['nullable', 'numeric', 'gt:0', 'required_without:amount_paid'],
            'amount_paid' => ['nullable', 'numeric', 'gt:0', 'required_without:amount'],
            'payment_method' => ['required', 'in:cash,esewa,bank'],
            'payment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
