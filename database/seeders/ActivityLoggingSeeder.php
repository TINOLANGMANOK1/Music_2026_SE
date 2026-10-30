<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActivityLoggingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing data
        $students = DB::table('student')->pluck('student_id')->toArray();
        $cubicles = DB::table('cubicle_info')->pluck('cubicle_id')->toArray();
        $assets = DB::table('assets')->pluck('id')->toArray();

        if (empty($students) || empty($cubicles) || empty($assets)) {
            $this->command->warn('⚠️  Not enough data to seed activity logs. Make sure student, cubicle_info, and assets tables have data.');
            return;
        }

        $now = Carbon::now();
        
        // Seed cubicle_usage (practice sessions)
        $cubicleUsageData = [];
        for ($i = 0; $i < 50; $i++) {
            $date = $now->copy()->subDays(rand(0, 60));
            $cubicleUsageData[] = [
                'student_id' => $students[array_rand($students)],
                'cubicle_id' => $cubicles[array_rand($cubicles)],
                'usage_date' => $date->toDateString(),
                'start_time' => $date->copy()->addHours(rand(8, 18)),
                'end_time' => $date->copy()->addHours(rand(8, 18))->addMinutes(rand(30, 120)),
                'duration' => rand(30, 120),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('cubicle_usage')->insert($cubicleUsageData);
        $this->command->info('✅ Seeded cubicle_usage: ' . count($cubicleUsageData) . ' records');

        // Seed instrument_usage (borrow/return)
        $instrumentUsageData = [];
        for ($i = 0; $i < 40; $i++) {
            $date = $now->copy()->subDays(rand(0, 60));
            $borrowTime = $date->copy()->addHours(rand(8, 16));
            $returnTime = $borrowTime->copy()->addHours(rand(1, 8));
            
            $instrumentUsageData[] = [
                'student_id' => $students[array_rand($students)],
                'instrument_id' => $assets[array_rand($assets)],
                'usage_date' => $date->toDateString(),
                'borrow_time' => $borrowTime,
                'return_time' => $returnTime,
                'duration' => $borrowTime->diffInMinutes($returnTime),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('instrument_usage')->insert($instrumentUsageData);
        $this->command->info('✅ Seeded instrument_usage: ' . count($instrumentUsageData) . ' records');

        // Seed tool_usage (borrow/return)
        $toolUsageData = [];
        for ($i = 0; $i < 30; $i++) {
            $date = $now->copy()->subDays(rand(0, 60));
            $borrowTime = $date->copy()->addHours(rand(8, 16));
            $returnTime = $borrowTime->copy()->addHours(rand(1, 6));
            
            $toolUsageData[] = [
                'student_id' => $students[array_rand($students)],
                'tool_id' => $assets[array_rand($assets)],
                'usage_date' => $date->toDateString(),
                'borrow_time' => $borrowTime,
                'return_time' => $returnTime,
                'duration' => $borrowTime->diffInMinutes($returnTime),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('tool_usage')->insert($toolUsageData);
        $this->command->info('✅ Seeded tool_usage: ' . count($toolUsageData) . ' records');

        $this->command->info('✅ Activity logging tables seeded successfully!');
    }
}
