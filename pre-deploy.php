<?php

/**
 * Railway Pre-Deployment Script
 * Handles migration conflicts before running migrations
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking for migration conflicts...\n";

// Check if asset_disposals table exists
if (Schema::hasTable('asset_disposals')) {
    echo "asset_disposals table exists, checking migration records...\n";
    
    $migrationExists = DB::table('migrations')
        ->where('migration', '2025_11_06_184539_create_asset_disposals_table')
        ->exists();
    
    if (!$migrationExists) {
        echo "Marking migration as completed...\n";
        DB::table('migrations')->insert([
            'migration' => '2025_11_06_184539_create_asset_disposals_table',
            'batch' => DB::table('migrations')->max('batch') + 1
        ]);
        echo "✓ Migration marked as completed\n";
    } else {
        echo "✓ Migration already recorded\n";
    }
} else {
    echo "✓ No conflicts found\n";
}

echo "Pre-deployment checks complete!\n";
