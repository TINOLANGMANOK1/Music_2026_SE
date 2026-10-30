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
        Schema::create('instrument_info', function (Blueprint $table) {
            $table->string('instrument_id')->primary();
            $table->string('instrument_type_id')->nullable();
            $table->string('instrument_type');
            $table->string('instrument_no');
            $table->enum('status', ['Available', 'Borrowed', 'Maintenance'])->default('Available');
            $table->string('brand')->nullable();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('barcode')->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instrument_info');
    }
};
