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
        if (!Schema::hasTable('assets')) {
            return;
        }

        Schema::table('assets', function (Blueprint $table) {
            if (!Schema::hasColumn('assets', 'repair_description')) {
                $table->text('repair_description')->nullable()->after('description');
            }
            if (!Schema::hasColumn('assets', 'repair_image')) {
                $table->string('repair_image')->nullable()->after('repair_description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('assets')) {
            return;
        }

        Schema::table('assets', function (Blueprint $table) {
            $columns = array_filter(
                ['repair_description', 'repair_image'],
                fn (string $column): bool => Schema::hasColumn('assets', $column)
            );

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
