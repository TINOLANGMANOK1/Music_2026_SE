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
        if (Schema::hasTable('mtl_bookings') && !Schema::hasColumn('mtl_bookings', 'student_id')) {
            Schema::table('mtl_bookings', function (Blueprint $table) {
                $table->string('student_id')->nullable()->after('user_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('mtl_bookings') && Schema::hasColumn('mtl_bookings', 'student_id')) {
            Schema::table('mtl_bookings', function (Blueprint $table) {
                $table->dropColumn('student_id');
            });
        }
    }
};
