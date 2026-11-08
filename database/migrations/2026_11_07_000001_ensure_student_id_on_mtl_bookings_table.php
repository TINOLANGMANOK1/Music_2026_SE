<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mtl_bookings') && !Schema::hasColumn('mtl_bookings', 'student_id')) {
            Schema::table('mtl_bookings', function (Blueprint $table) {
                $table->string('student_id')->nullable()->after('user_id');
            });
        }
    }

    public function down(): void
    {
        // Keep the compatibility column when rolling back; it may predate this migration.
    }
};
