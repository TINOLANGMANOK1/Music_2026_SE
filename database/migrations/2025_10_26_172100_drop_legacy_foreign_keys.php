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
        // Drop foreign keys from tool_usage
        try {
            DB::statement('ALTER TABLE tool_usage DROP FOREIGN KEY tool_usage_tool_id_foreign');
        } catch (\Exception $e) {
            // Foreign key might not exist, that's okay
        }

        // Drop foreign keys from instrument_usage
        try {
            DB::statement('ALTER TABLE instrument_usage DROP FOREIGN KEY instrument_usage_instrument_id_foreign');
        } catch (\Exception $e) {
            // Foreign key might not exist, that's okay
        }

        // Drop foreign keys from tool_bookings
        try {
            DB::statement('ALTER TABLE tool_bookings DROP FOREIGN KEY tool_bookings_tool_id_foreign');
        } catch (\Exception $e) {
            // Foreign key might not exist, that's okay
        }

        // Drop foreign keys from instrument_bookings
        try {
            DB::statement('ALTER TABLE instrument_bookings DROP FOREIGN KEY instrument_bookings_instrument_id_foreign');
        } catch (\Exception $e) {
            // Foreign key might not exist, that's okay
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to re-add the old foreign keys
    }
};
