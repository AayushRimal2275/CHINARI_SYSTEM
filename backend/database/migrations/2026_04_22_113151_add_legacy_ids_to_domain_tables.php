<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_id')->nullable()->unique()->after('id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_id')->nullable()->unique()->after('id');
        });

        Schema::table('inventories', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_id')->nullable()->unique()->after('id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_id')->nullable()->unique()->after('id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_id')->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['legacy_id']);
            $table->dropColumn('legacy_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['legacy_id']);
            $table->dropColumn('legacy_id');
        });

        Schema::table('inventories', function (Blueprint $table) {
            $table->dropUnique(['legacy_id']);
            $table->dropColumn('legacy_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['legacy_id']);
            $table->dropColumn('legacy_id');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropUnique(['legacy_id']);
            $table->dropColumn('legacy_id');
        });
    }
};
