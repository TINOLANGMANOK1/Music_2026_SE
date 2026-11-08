<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('instrument_info')) {
            return;
        }

        Schema::table('instrument_info', function (Blueprint $table) {
            if (!Schema::hasColumn('instrument_info', 'brand')) {
                $table->string('brand')->nullable()->after('status');
            }
            if (!Schema::hasColumn('instrument_info', 'description')) {
                $table->text('description')->nullable()->after('brand');
            }
            if (!Schema::hasColumn('instrument_info', 'image_url')) {
                $table->string('image_url')->nullable()->after('description');
            }
            if (!Schema::hasColumn('instrument_info', 'barcode')) {
                $table->string('barcode')->nullable()->after('image_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('instrument_info')) {
            return;
        }

        Schema::table('instrument_info', function (Blueprint $table) {
            $columns = array_filter(
                ['brand', 'description', 'image_url', 'barcode'],
                fn (string $column): bool => Schema::hasColumn('instrument_info', $column)
            );

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
