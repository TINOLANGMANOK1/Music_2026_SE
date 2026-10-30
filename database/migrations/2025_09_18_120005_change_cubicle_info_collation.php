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
        Schema::table('cubicle_info', function (Blueprint $table) {
            DB::statement('ALTER TABLE cubicle_info CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cubicle_info', function (Blueprint $table) {
            DB::statement('ALTER TABLE cubicle_info CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;');
        });
    }
};
