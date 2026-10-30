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
        Schema::create('cubicle_info', function (Blueprint $table) {
            $table->id();
            $table->string('cubicle_id')->unique();
            $table->string('cubicle_name');
            $table->string('cubicle_num');
            $table->enum('cubicle_loc', ['LSGH 2F', 'LSGH 1F']);
            $table->enum('status', ['Available', 'Occupied', 'Maintenance'])->default('Available');
            $table->string('current_user')->nullable();
            $table->timestamp('session_start')->nullable();
            $table->timestamp('session_end')->nullable();
            $table->integer('total_time_spent')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cubicle_info');
    }
};
