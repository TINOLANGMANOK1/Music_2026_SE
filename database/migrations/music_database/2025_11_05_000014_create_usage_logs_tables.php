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
        Schema::create('cubicle_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('cubicle_id');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->integer('duration')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('student')->onDelete('cascade');
            $table->foreign('cubicle_id')->references('cubicle_id')->on('cubicle_info')->onDelete('cascade');
        });

        Schema::create('instrument_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('instrument_id');
            $table->timestamp('borrow_time');
            $table->timestamp('return_time')->nullable();
            $table->integer('duration')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('student')->onDelete('cascade');
            $table->foreign('instrument_id')->references('instrument_id')->on('instrument_info')->onDelete('cascade');
        });

        Schema::create('tool_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('tool_id');
            $table->timestamp('borrow_time');
            $table->timestamp('return_time')->nullable();
            $table->integer('duration')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('student')->onDelete('cascade');
            $table->foreign('tool_id')->references('tool_id')->on('tools_info')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tool_usage_logs');
        Schema::dropIfExists('instrument_usage_logs');
        Schema::dropIfExists('cubicle_usage_logs');
    }
};
