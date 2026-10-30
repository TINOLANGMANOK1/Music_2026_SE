<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportAssetsFromSQL extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assets:import {file=assets_data_only.sql}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import assets from SQL file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $file = $this->argument('file');
        $path = base_path($file);

        if (!file_exists($path)) {
            $this->error("File not found: {$path}");
            return 1;
        }

        try {
            $sql = file_get_contents($path);
            
            // Split into individual statements
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                fn($stmt) => !empty($stmt) && !str_starts_with($stmt, '--')
            );

            $this->info("Importing " . count($statements) . " records...");
            
            foreach ($statements as $statement) {
                DB::unprepared($statement . ';');
            }

            $this->info("✅ Assets imported successfully!");
            
            $count = DB::table('assets')->count();
            $this->info("Total assets in database: {$count}");
            
            return 0;
        } catch (\Exception $e) {
            $this->error("Import failed: " . $e->getMessage());
            return 1;
        }
    }
}
