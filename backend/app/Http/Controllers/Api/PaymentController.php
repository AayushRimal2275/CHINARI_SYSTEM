<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()->with('vendor');

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->integer('vendor_id'));
        }

        if ($request->filled('sale_id')) {
            $query->where('sale_id', $request->integer('sale_id'));
        }

        $payments = $query->latest('payment_date')->paginate($request->integer('per_page', 15));

        return $this->success([
            'items' => PaymentResource::collection($payments->items()),
        ], 'Payments fetched successfully.', meta: [
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'last_page' => $payments->lastPage(),
            ],
        ]);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $payment = DB::transaction(function () use ($request) {
            $sale = null;

            if ($request->filled('sale_id')) {
                $sale = Sale::query()->lockForUpdate()->findOrFail($request->integer('sale_id'));
                if ($sale->vendor_id !== $request->integer('vendor_id')) {
                    abort(422, 'Sale does not belong to the selected vendor.');
                }
            }

            $payment = Payment::query()->create([
                'vendor_id' => $request->integer('vendor_id'),
                'sale_id' => $request->input('sale_id'),
                'amount' => $request->input('amount'),
                'payment_date' => $request->input('payment_date', now()),
                'notes' => $request->input('notes'),
            ]);

            if ($sale) {
                $paidAmount = (float) $sale->payments()->sum('amount');
                $status = $paidAmount >= (float) $sale->total_amount
                    ? 'paid'
                    : ($paidAmount > 0 ? 'partial' : 'unpaid');

                $sale->update([
                    'paid_amount' => $paidAmount,
                    'payment_status' => $status,
                ]);
            }

            return $payment;
        });

        return $this->success(new PaymentResource($payment->load('vendor')), 'Payment recorded successfully.', 201);
    }
}
