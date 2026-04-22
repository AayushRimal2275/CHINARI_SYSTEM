<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/dashboard', DashboardController::class);

    Route::apiResource('products', ProductController::class);
    Route::post('/products/{product}/restore', [ProductController::class, 'restore']);

    Route::apiResource('vendors', VendorController::class);
    Route::apiResource('inventory', InventoryController::class)->only(['index', 'show', 'update']);
    Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);

    Route::apiResource('sales', SaleController::class)->only(['index', 'store', 'show']);
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store']);
});
