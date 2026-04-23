<?php

namespace App\Http\Controllers\Api;

use App\Models\Inventory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;

class DashboardController extends ApiController
{
    public function __invoke(): JsonResponse
    {
        $today = now()->startOfDay();

        $recentSales = Sale::query()->with('vendor')->latest('sale_date')->limit(5)->get();
        $lowStock = Inventory::query()->with('product')->whereColumn('quantity', '<=', 'reorder_level')->latest()->limit(10)->get();

        return $this->success([
            'totals' => [
                'products' => Product::query()->count(),
                'vendors' => Vendor::query()->count(),
                'sales' => number_format((float) Sale::query()->sum('total_amount'), 2, '.', ''),
                'payments' => number_format((float) Payment::query()->sum('amount'), 2, '.', ''),
                'due' => number_format((float) Sale::query()->sum('total_amount') - (float) Payment::query()->sum('amount'), 2, '.', ''),
                'today_sales' => number_format((float) Sale::query()->where('sale_date', '>=', $today)->sum('total_amount'), 2, '.', ''),
                'low_stock_alerts' => $lowStock->count(),
            ],
            'revenue' => [
                'weekly' => number_format((float) Sale::query()->where('sale_date', '>=', now()->startOfWeek())->sum('total_amount'), 2, '.', ''),
                'monthly' => number_format((float) Sale::query()->where('sale_date', '>=', now()->startOfMonth())->sum('total_amount'), 2, '.', ''),
            ],
            'recent_sales' => $recentSales,
            'low_stock' => $lowStock,
            'recent_transactions' => Payment::query()->with('vendor', 'sale')->latest('payment_date')->limit(5)->get(),
        ], 'Dashboard fetched successfully.');
    }
}
