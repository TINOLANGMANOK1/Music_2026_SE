<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('instrument_bookings', function (Blueprint $table) {
            DB::statement('ALTER TABLE instrument_bookings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instrument_bookings', function (Blueprint $table) {
            DB::statement('ALTER TABLE instrument_bookings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;');
        });
    }
};
