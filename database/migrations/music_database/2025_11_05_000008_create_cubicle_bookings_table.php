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
        Schema::create('cubicle_bookings', function (Blueprint $table) {
            $table->id('booking_id');
            $table->string('student_id');
            $table->string('cubicle_id');
            $table->date('booking_date');
            $table->time('time_in');
            $table->time('time_out')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();

            $table->foreign('student_id')->references('student_id')->on('student')->onDelete('cascade');
            $table->foreign('cubicle_id')->references('cubicle_id')->on('cubicle_info')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cubicle_bookings');
    }
};
