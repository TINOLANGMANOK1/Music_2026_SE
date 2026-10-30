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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code')->unique();
            $table->string('name');
            $table->string('category');
            $table->string('office');
            $table->text('description')->nullable();
            $table->date('date_acquired')->nullable();
            $table->decimal('value', 10, 2)->nullable();
            $table->boolean('is_borrowable')->default(true);
            $table->enum('status', ['Available', 'Borrowed', 'Under Repair', 'Disposed'])->default('Available');
            $table->text('repair_description')->nullable();
            $table->string('repair_image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
