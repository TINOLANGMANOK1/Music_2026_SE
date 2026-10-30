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
        Schema::create('cubicle_counts', function (Blueprint $table) {
            $table->id();
            $table->string('cubicle_id');
            $table->integer('usage_count')->default(0);
            $table->timestamps();

            $table->foreign('cubicle_id')->references('cubicle_id')->on('cubicle_info')->onDelete('cascade');
        });

        Schema::create('instrument_counts', function (Blueprint $table) {
            $table->id();
            $table->string('instrument_id');
            $table->integer('usage_count')->default(0);
            $table->timestamps();

            $table->foreign('instrument_id')->references('instrument_id')->on('instrument_info')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instrument_counts');
        Schema::dropIfExists('cubicle_counts');
    }
};
