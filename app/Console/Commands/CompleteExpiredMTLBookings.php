<?php

namespace App\Console\Commands;

use App\Models\MTLBooking;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompleteExpiredMTLBookings extends Command
{
    protected $signature = 'mtl:complete-expired-bookings';

    protected $description = 'Complete expired MTL bookings and deduct their students booked time';

    public function handle(): int
    {
        $now = now();
        $bookingIds = MTLBooking::query()
            ->where('status', 'approved')
            ->where(function ($query) use ($now) {
                $query->whereDate('date', '<', $now->toDateString())
                    ->orWhere(function ($today) use ($now) {
                        $today->whereDate('date', $now->toDateString())
                            ->where('end_time', '<=', $now->format('H:i:s'));
                    });
            })
            ->pluck('id');

        $completedCount = 0;

        foreach ($bookingIds as $bookingId) {
            $completed = DB::transaction(function () use ($bookingId): bool {
                $booking = MTLBooking::query()
                    ->whereKey($bookingId)
                    ->lockForUpdate()
                    ->first();

                if (!$booking || $booking->status !== 'approved') {
                    return false;
                }

                $startAt = Carbon::parse($booking->date->toDateString().' '.$booking->start_time);
                $endAt = Carbon::parse($booking->date->toDateString().' '.$booking->end_time);
                if ($endAt->isFuture()) {
                    return false;
                }

                $durationMinutes = max(0, (int) $startAt->diffInMinutes($endAt));

                if ($booking->student_id) {
                    $student = DB::table('student')
                        ->where('student_id', $booking->student_id)
                        ->lockForUpdate()
                        ->first();

                    if ($student) {
                        DB::table('student')
                            ->where('student_id', $student->student_id)
                            ->update([
                                'mtl_time_remaining' => max(0, $student->mtl_time_remaining - $durationMinutes),
                            ]);
                    } else {
                        Log::warning('Completed MTL booking has no matching student', [
                            'booking_id' => $booking->id,
                            'student_id' => $booking->student_id,
                        ]);
                    }
                }

                $booking->update(['status' => 'completed']);

                return true;
            });

            if ($completed) {
                $completedCount++;
            }
        }

        $this->info("Completed {$completedCount} expired MTL booking(s).");

        return self::SUCCESS;
    }
}
