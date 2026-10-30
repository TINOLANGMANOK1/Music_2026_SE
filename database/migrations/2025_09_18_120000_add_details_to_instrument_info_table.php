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
        Schema::table('instrument_info', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('status');
            $table->text('description')->nullable()->after('brand');
            $table->string('image_url')->nullable()->after('description');
            $table->string('barcode')->nullable()->after('image_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instrument_info', function (Blueprint $table) {
            $table->dropColumn(['brand', 'description', 'image_url', 'barcode']);
        });
    }
};
