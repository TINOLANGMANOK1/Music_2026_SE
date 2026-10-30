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
            $table->increments('booking_id');
            $table->string('student_id', 50);
            $table->integer('tool_id');
            $table->integer('tool_no');
            $table->string('tool_type', 45);
            $table->date('booking_date');
            $table->dateTime('time_in');
            $table->dateTime('time_out')->nullable();
            $table->enum('status', ['Pending', 'Active', 'Completed', 'Cancelled'])->default('Active');
            $table->timestamp('created_at')->useCurrent();

            $table->index('student_id');
            $table->index('tool_id');

            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';
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