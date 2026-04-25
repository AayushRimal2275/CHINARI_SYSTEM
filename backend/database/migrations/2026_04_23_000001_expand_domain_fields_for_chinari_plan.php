<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('category', ['tea', 'masala'])->default('tea')->after('name');
            $table->text('description')->nullable()->after('category');
            $table->string('image')->nullable()->after('unit');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('is_active');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->timestamp('movement_date')->nullable()->after('notes');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('contact_person', 100)->nullable()->after('name');
            $table->string('email')->nullable()->after('phone');
            $table->text('product_categories_supplied')->nullable()->after('address');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('product_categories_supplied');
        });

        Schema::create('product_vendor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['product_id', 'vendor_id']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('customer_name', 100)->nullable()->after('vendor_id');
            $table->string('customer_phone', 25)->nullable()->after('customer_name');
            $table->text('notes')->nullable()->after('payment_status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'esewa', 'bank'])->default('cash')->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'customer_phone', 'notes']);
        });

        Schema::dropIfExists('product_vendor');

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['contact_person', 'email', 'product_categories_supplied', 'status']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('movement_date');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['category', 'description', 'image', 'status']);
        });
    }
};
