<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cubicle_info')) {
            Schema::table('cubicle_info', function (Blueprint $table) {
                if (!Schema::hasColumn('cubicle_info', 'cubicle_type_id')) {
                    $table->unsignedInteger('cubicle_type_id')->nullable();
                }
                if (!Schema::hasColumn('cubicle_info', 'cubicle_type')) {
                    $table->string('cubicle_type', 45)->nullable();
                }
                if (!Schema::hasColumn('cubicle_info', 'cubicle_no')) {
                    $table->unsignedInteger('cubicle_no')->nullable();
                }
            });

            if (Schema::hasColumn('cubicle_info', 'cubicle_num')) {
                DB::table('cubicle_info')
                    ->whereNull('cubicle_no')
                    ->update(['cubicle_no' => DB::raw('cubicle_num')]);
            }
        }

        if (Schema::hasTable('cubicle_bookings')) {
            Schema::table('cubicle_bookings', function (Blueprint $table) {
                if (!Schema::hasColumn('cubicle_bookings', 'cubicle_no')) {
                    $table->unsignedInteger('cubicle_no')->nullable();
                }
                if (!Schema::hasColumn('cubicle_bookings', 'cubicle_type')) {
                    $table->string('cubicle_type', 45)->nullable();
                }
            });
        }

        if (Schema::hasTable('cubicle_usage')) {
            Schema::table('cubicle_usage', function (Blueprint $table) {
                if (!Schema::hasColumn('cubicle_usage', 'cubicle_no')) {
                    $table->unsignedInteger('cubicle_no')->nullable();
                }
                if (!Schema::hasColumn('cubicle_usage', 'usage_date')) {
                    $table->date('usage_date')->nullable();
                }
            });
        }

        if (Schema::hasTable('instrument_usage')) {
            Schema::table('instrument_usage', function (Blueprint $table) {
                if (!Schema::hasColumn('instrument_usage', 'instrument_no')) {
                    $table->string('instrument_no')->nullable();
                }
                if (!Schema::hasColumn('instrument_usage', 'usage_date')) {
                    $table->date('usage_date')->nullable();
                }
                if (!Schema::hasColumn('instrument_usage', 'start_time')) {
                    $table->timestamp('start_time')->nullable();
                }
                if (!Schema::hasColumn('instrument_usage', 'end_time')) {
                    $table->timestamp('end_time')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // Keep compatibility columns to avoid discarding usage history on rollback.
    }
};
