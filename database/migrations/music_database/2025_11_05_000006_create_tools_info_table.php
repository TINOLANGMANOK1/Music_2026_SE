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
        Schema::create('tools_info', function (Blueprint $table) {
            $table->string('tool_id')->primary();
            $table->string('tool_type');
            $table->string('tool_no');
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
        Schema::dropIfExists('tools_info');
    }
};
