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
        Schema::create('tool_bookings', function (Blueprint $table) {
            $table->id('booking_id');
            $table->string('student_id');
            $table->string('tool_id');
            $table->string('tool_no')->nullable();
            $table->string('tool_type')->nullable();
            $table->date('booking_date');
            $table->time('time_in');
            $table->time('end_time')->nullable();
            $table->string('status')->default('Active');
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
        Schema::dropIfExists('tool_bookings');
    }
};
