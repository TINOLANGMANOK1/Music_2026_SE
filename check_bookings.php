<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bookings = DB::table('cecilia_hall_bookings')
    ->select('id', 'name', 'booker_type', 'letter_path')
    ->get();

echo "Total bookings: " . $bookings->count() . "\n\n";

foreach ($bookings as $booking) {
    echo "ID: {$booking->id}\n";
    echo "Name: {$booking->name}\n";
    echo "Booker Type: {$booking->booker_type}\n";
    echo "Letter Path: " . ($booking->letter_path ?? 'NULL') . "\n";
    if ($booking->letter_path) {
        $fullPath = storage_path('app/public/' . $booking->letter_path);
        echo "File exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
    }
    echo "---\n";
}
