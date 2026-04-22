<?php

namespace App\Console\Commands;

use App\Models\Inventory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Vendor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use JsonException;

class ImportDjangoData extends Command
{
    protected $signature = 'migrate:django-data {file : Absolute path to JSON export file} {--dry-run : Validate without writing}';

    protected $description = 'Import Django entities into Laravel schema with idempotent upserts and reconciliation summary.';

    public function handle(): int
    {
        $filePath = $this->argument('file');
        if (! is_string($filePath) || ! is_file($filePath)) {
            $this->error('Input file does not exist.');
            return self::FAILURE;
        }

        try {
            $payload = json_decode(file_get_contents($filePath), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            $this->error('Invalid JSON file: '.$exception->getMessage());
            return self::FAILURE;
        }

        $requiredKeys = ['vendors', 'products', 'inventories', 'sales', 'payments'];
        foreach ($requiredKeys as $key) {
            if (! array_key_exists($key, $payload) || ! is_array($payload[$key])) {
                $this->error("Missing required array key: {$key}");
                return self::FAILURE;
            }
        }

        if ($this->option('dry-run')) {
            $this->info('Dry run successful: payload structure is valid.');
            $this->table(['Entity', 'Rows'], [
                ['vendors', count($payload['vendors'])],
                ['products', count($payload['products'])],
                ['inventories', count($payload['inventories'])],
                ['sales', count($payload['sales'])],
                ['payments', count($payload['payments'])],
            ]);
            return self::SUCCESS;
        }

        DB::transaction(function () use ($payload): void {
            foreach ($payload['vendors'] as $vendorRow) {
                Vendor::query()->updateOrCreate(
                    ['legacy_id' => $vendorRow['id']],
                    [
                        'name' => $vendorRow['name'],
                        'phone' => $vendorRow['phone'] ?? null,
                        'address' => $vendorRow['address'] ?? null,
                    ]
                );
            }

            foreach ($payload['products'] as $productRow) {
                Product::query()->updateOrCreate(
                    ['legacy_id' => $productRow['id']],
                    [
                        'name' => $productRow['name'],
                        'unit' => $productRow['unit'],
                        'price_per_unit' => $productRow['price_per_unit'],
                        'is_active' => true,
                    ]
                );
            }

            foreach ($payload['inventories'] as $inventoryRow) {
                $product = Product::query()->where('legacy_id', $inventoryRow['product_id'])->firstOrFail();

                Inventory::query()->updateOrCreate(
                    ['legacy_id' => $inventoryRow['id']],
                    [
                        'product_id' => $product->id,
                        'quantity' => $inventoryRow['quantity'],
                        'reorder_level' => $inventoryRow['reorder_level'] ?? 10,
                        'last_movement_at' => now(),
                    ]
                );
            }

            foreach ($payload['sales'] as $saleRow) {
                $vendor = Vendor::query()->where('legacy_id', $saleRow['vendor_id'])->firstOrFail();
                $product = Product::query()->where('legacy_id', $saleRow['product_id'])->firstOrFail();

                $sale = Sale::query()->updateOrCreate(
                    ['legacy_id' => $saleRow['id']],
                    [
                        'vendor_id' => $vendor->id,
                        'sale_number' => $saleRow['sale_number'] ?? sprintf('LEGACY-SAL-%s', $saleRow['id']),
                        'total_amount' => $saleRow['total_amount'],
                        'paid_amount' => 0,
                        'payment_status' => 'unpaid',
                        'sale_date' => $saleRow['created_at'] ?? now(),
                    ]
                );

                SaleItem::query()->updateOrCreate(
                    [
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity' => $saleRow['quantity'],
                        'price_per_unit' => $saleRow['price_per_unit'],
                        'line_total' => $saleRow['total_amount'],
                    ]
                );

                $inventory = Inventory::query()->where('product_id', $product->id)->first();
                if ($inventory) {
                    StockMovement::query()->updateOrCreate(
                        [
                            'inventory_id' => $inventory->id,
                            'reference_type' => 'sale',
                            'reference_id' => $sale->id,
                        ],
                        [
                            'type' => 'out',
                            'quantity' => $saleRow['quantity'],
                            'notes' => 'Imported from legacy Django sale.',
                        ]
                    );
                }
            }

            foreach ($payload['payments'] as $paymentRow) {
                $vendor = Vendor::query()->where('legacy_id', $paymentRow['vendor_id'])->firstOrFail();
                $sale = ! empty($paymentRow['sale_id'])
                    ? Sale::query()->where('legacy_id', $paymentRow['sale_id'])->first()
                    : null;

                Payment::query()->updateOrCreate(
                    ['legacy_id' => $paymentRow['id']],
                    [
                        'vendor_id' => $vendor->id,
                        'sale_id' => $sale?->id,
                        'amount' => $paymentRow['amount'],
                        'payment_date' => $paymentRow['payment_date'] ?? now(),
                        'notes' => $paymentRow['notes'] ?? null,
                    ]
                );
            }

            Sale::query()->with('payments')->get()->each(function (Sale $sale): void {
                $paidAmount = (float) $sale->payments->sum('amount');
                $status = $paidAmount >= (float) $sale->total_amount
                    ? 'paid'
                    : ($paidAmount > 0 ? 'partial' : 'unpaid');

                $sale->update([
                    'paid_amount' => $paidAmount,
                    'payment_status' => $status,
                ]);
            });
        });

        $this->info('Import finished successfully.');
        $this->table(['Entity', 'Imported'], [
            ['vendors', Vendor::query()->count()],
            ['products', Product::query()->count()],
            ['inventories', Inventory::query()->count()],
            ['sales', Sale::query()->count()],
            ['payments', Payment::query()->count()],
        ]);

        return self::SUCCESS;
    }
}
