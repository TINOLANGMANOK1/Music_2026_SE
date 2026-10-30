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
        // Create cubicle_usage table
        if (!Schema::hasTable('cubicle_usage')) {
            Schema::create('cubicle_usage', function (Blueprint $table) {
                $table->id();
                $table->string('student_id')->nullable();
                $table->string('cubicle_id')->nullable();
                $table->date('usage_date')->nullable();
                $table->timestamp('start_time')->nullable();
                $table->timestamp('end_time')->nullable();
                $table->integer('duration')->nullable();
                $table->timestamps();

                // Add foreign keys if the referenced tables exist
                if (Schema::hasTable('student')) {
                    $table->foreign('student_id')->references('student_id')->on('student')->onDelete('set null');
                }
                if (Schema::hasTable('cubicle_info')) {
                    $table->foreign('cubicle_id')->references('cubicle_id')->on('cubicle_info')->onDelete('set null');
                }
            });
        }

        // Create instrument_usage table
        if (!Schema::hasTable('instrument_usage')) {
            Schema::create('instrument_usage', function (Blueprint $table) {
                $table->id();
                $table->string('student_id')->nullable();
                $table->unsignedBigInteger('instrument_id')->nullable();
                $table->date('usage_date')->nullable();
                $table->timestamp('borrow_time')->nullable();
                $table->timestamp('return_time')->nullable();
                $table->integer('duration')->nullable();
                $table->timestamps();

                // Add foreign keys if the referenced tables exist
                if (Schema::hasTable('student')) {
                    $table->foreign('student_id')->references('student_id')->on('student')->onDelete('set null');
                }
                if (Schema::hasTable('assets')) {
                    $table->foreign('instrument_id')->references('id')->on('assets')->onDelete('set null');
                }
            });
        }

        // Create tool_usage table
        if (!Schema::hasTable('tool_usage')) {
            Schema::create('tool_usage', function (Blueprint $table) {
                $table->id();
                $table->string('student_id')->nullable();
                $table->unsignedBigInteger('tool_id')->nullable();
                $table->date('usage_date')->nullable();
                $table->timestamp('borrow_time')->nullable();
                $table->timestamp('return_time')->nullable();
                $table->integer('duration')->nullable();
                $table->timestamps();

                // Add foreign keys if the referenced tables exist
                if (Schema::hasTable('student')) {
                    $table->foreign('student_id')->references('student_id')->on('student')->onDelete('set null');
                }
                if (Schema::hasTable('assets')) {
                    $table->foreign('tool_id')->references('id')->on('assets')->onDelete('set null');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tool_usage');
        Schema::dropIfExists('instrument_usage');
        Schema::dropIfExists('cubicle_usage');
    }
};
