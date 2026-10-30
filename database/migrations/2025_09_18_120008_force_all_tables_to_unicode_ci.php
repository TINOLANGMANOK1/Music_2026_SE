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
        $tables = [
            'users',
            'cache',
            'cache_locks',
            'cubicle_bookings',
            'cubicle_counts',
            'cubicle_info',
            'cubicle_usage',
            'cubicle_usage_logs',
            'failed_jobs',
            'instrument_bookings',
            'instrument_counts',
            'instrument_info',
            'instrument_usage',
            'instrument_usage_logs',
            'jobs',
            'job_batches',
            'migrations',
            'password_resets',
            'password_reset_tokens',
            'sessions',
            'student',
            'tools_info',
            'tool_bookings',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting collation changes is complex and might lead to data loss.
        // It's generally not recommended to rollback collation changes unless absolutely necessary.
        // For this specific scenario, we'll leave the down method empty or revert to general_ci if needed.
        // For now, leaving it empty as the goal is to fix the up() part.
        $tables = [
            'users',
            'cache',
            'cache_locks',
            'cubicle_bookings',
            'cubicle_counts',
            'cubicle_info',
            'cubicle_usage',
            'cubicle_usage_logs',
            'failed_jobs',
            'instrument_bookings',
            'instrument_counts',
            'instrument_info',
            'instrument_usage',
            'instrument_usage_logs',
            'jobs',
            'job_batches',
            'migrations',
            'password_resets',
            'password_reset_tokens',
            'sessions',
            'student',
            'tools_info',
            'tool_bookings',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
            }
        }
    }
};
