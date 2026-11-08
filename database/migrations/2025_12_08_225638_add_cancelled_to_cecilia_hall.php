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
        if (!Schema::hasTable('cecilia_hall_bookings')) {
            return;
        }

        Schema::table('cecilia_hall_bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('cecilia_hall_bookings', 'cancelled_by')) {
                $table->foreignId('cancelled_by')->nullable()->after('approved_at')->constrained('users');
            }
            if (!Schema::hasColumn('cecilia_hall_bookings', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('cecilia_hall_bookings', 'cancellation_reason')) {
                $table->string('cancellation_reason')->nullable()->after('approved_at');
            }
        });
        
        // Add 'cancelled' to status enum
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE cecilia_hall_bookings MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('cecilia_hall_bookings')) {
            return;
        }

        Schema::table('cecilia_hall_bookings', function (Blueprint $table) {
            if (Schema::hasColumn('cecilia_hall_bookings', 'cancelled_by')) {
                $table->dropForeign(['cancelled_by']);
                $table->dropColumn('cancelled_by');
            }
            if (Schema::hasColumn('cecilia_hall_bookings', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }
            if (Schema::hasColumn('cecilia_hall_bookings', 'cancellation_reason')) {
                $table->dropColumn('cancellation_reason');
            }
        });
        
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE cecilia_hall_bookings MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending'");
        }
    }
};
