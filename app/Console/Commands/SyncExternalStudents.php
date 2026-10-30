<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncExternalStudents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:external-students {--force : Skip confirmation and sync immediately}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Sync student data from external API into local database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Starting external student sync...');

        // Get API credentials
        $url = config('services.student_api.url');
        $clientId = config('services.student_api.id');
        $clientSecret = config('services.student_api.secret');

        if (empty($url) || empty($clientId) || empty($clientSecret)) {
            $this->error('❌ API credentials not configured in .env file');
            return 1;
        }

        $this->info("📡 Fetching students from API: {$url}");

        try {
            // Fetch from external API
            $response = Http::withHeaders([
                'X-API-Client-ID' => $clientId,
                'X-API-Client-Secret' => $clientSecret,
                'Content-Type' => 'application/json',
            ])->timeout(30)->get($url);

            if (!$response->successful()) {
                $this->error("❌ API call failed with status {$response->status()}");
                return 1;
            }

            $apiResponse = $response->json();

            // Unwrap the response if it's nested
            $externalStudents = $apiResponse;
            if (is_array($apiResponse)) {
                if (isset($apiResponse['data'])) {
                    $externalStudents = $apiResponse['data'];
                } elseif (isset($apiResponse['students'])) {
                    $externalStudents = $apiResponse['students'];
                }
            } elseif (is_object($apiResponse)) {
                if (isset($apiResponse->data)) {
                    $externalStudents = $apiResponse->data;
                } elseif (isset($apiResponse->students)) {
                    $externalStudents = $apiResponse->students;
                } else {
                    $externalStudents = [$apiResponse];
                }
            }

            if (!is_array($externalStudents)) {
                $this->error('❌ Invalid API response format');
                return 1;
            }

            $this->info("✅ Retrieved " . count($externalStudents) . " students from API");

            // Ask for confirmation unless --force is used
            if (!$this->option('force')) {
                if (!$this->confirm("This will sync " . count($externalStudents) . " students. Continue?")) {
                    $this->info('❌ Sync cancelled');
                    return 0;
                }
            }

            // Process students
            $synced = 0;
            $skipped = 0;
            $updated = 0;

            foreach ($externalStudents as $apiStudent) {
                try {
                    $studentId = $apiStudent['student_number'] ?? $apiStudent['student_id'] ?? null;

                    if (!$studentId) {
                        $skipped++;
                        continue;
                    }

                    // Extract year from year_level (e.g., "Fourth Year" -> 4)
                    $yearLevel = $apiStudent['year_level'] ?? '';
                    $yearMap = [
                        'first year' => 1,
                        'second year' => 2,
                        'third year' => 3,
                        'fourth year' => 4,
                    ];
                    $year = $yearMap[strtolower($yearLevel)] ?? 3;

                    $data = [
                        'student_id' => $studentId,
                        'first_name' => $apiStudent['firstname'] ?? $apiStudent['first_name'] ?? 'Unknown',
                        'last_name' => $apiStudent['lastname'] ?? $apiStudent['last_name'] ?? 'Unknown',
                        'middle_initial' => $apiStudent['middlename'] ?? $apiStudent['middle_initial'] ?? '',
                        'year' => $year,
                        'sec' => $apiStudent['section'] ?? $apiStudent['sec'] ?? 'A',
                    ];

                    // Extract RFID if provided by API
                    $rfidUid = $apiStudent['rfid_code'] ?? $apiStudent['rfid_uid'] ?? $apiStudent['rfid'] ?? null;

                    // Check if student already exists
                    $existing = Student::where('student_id', $studentId)->first();

                    if ($existing) {
                        // Update existing student
                        $updateData = [
                            'first_name' => $data['first_name'],
                            'last_name' => $data['last_name'],
                            'middle_initial' => $data['middle_initial'],
                            'year' => $data['year'],
                            'sec' => $data['sec'],
                        ];
                        
                        // Only update RFID if API provided a valid one (not null)
                        if (!empty($rfidUid)) {
                            $updateData['rfid_uid'] = $rfidUid;
                        }
                        
                        $existing->update($updateData);
                        $updated++;
                    } else {
                        // Create new student with default MTL time and RFID if provided
                        Student::create(array_merge($data, [
                            'mtl_time_remaining' => 480, // Default 8 hours
                            'rfid_uid' => $rfidUid, // Will be null or the API value
                        ]));
                        $synced++;
                    }
                } catch (\Exception $e) {
                    $this->warn("⚠️  Error processing student {$studentId}: {$e->getMessage()}");
                    $skipped++;
                }
            }

            // Summary
            $this->newLine();
            $this->info('✅ Sync completed!');
            $this->line("  • Created: {$synced}");
            $this->line("  • Updated: {$updated}");
            $this->line("  • Skipped: {$skipped}");
            $this->newLine();
            $this->comment('📝 Note: RFID codes from API have been synced. Students without valid RFID codes (null) will need to be validated in the system.');

            Log::info('External student sync completed', [
                'created' => $synced,
                'updated' => $updated,
                'skipped' => $skipped,
            ]);

            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Sync failed: {$e->getMessage()}");
            Log::error('External student sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }
}
