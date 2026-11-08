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
        $this->setCollation('utf8mb4_unicode_ci');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->setCollation('utf8mb4_general_ci');
    }

    private function setCollation(string $collation): void
    {
        if (!Schema::hasTable('instrument_bookings') || !in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::statement("ALTER TABLE `instrument_bookings` CONVERT TO CHARACTER SET utf8mb4 COLLATE {$collation}");
    }
};
