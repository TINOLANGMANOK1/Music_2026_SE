<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Asset;

class AssetSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Check if assets already exist
        if (Asset::count() > 0) {
            $this->command->info('Assets already exist. Skipping seeder.');
            return;
        }
        
        $sqlFile = base_path('assets_data_only.sql');
        
        if (!file_exists($sqlFile)) {
            $this->command->error('SQL file not found: ' . $sqlFile);
            return;
        }
        
        try {
            $sql = file_get_contents($sqlFile);
            
            // Split into individual statements and filter out comments
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                fn($stmt) => !empty($stmt) && !str_starts_with($stmt, '--')
            );

            $this->command->info("Importing " . count($statements) . " asset records...");
            
            DB::beginTransaction();
            
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    DB::unprepared($statement . ';');
                }
            }
            
            DB::commit();
            
            $count = Asset::count();
            $this->command->info("✅ Successfully imported {$count} assets!");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Import failed: " . $e->getMessage());
        }
    }
}
