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
        Schema::create('asset_borrow_logs', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id');
            $table->string('student_id');
            $table->timestamp('borrow_time');
            $table->timestamp('return_time')->nullable();
            $table->integer('duration')->nullable();
            $table->timestamps();

            $table->foreign('asset_id')->references('asset_id')->on('assets')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('student')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_borrow_logs');
    }
};
