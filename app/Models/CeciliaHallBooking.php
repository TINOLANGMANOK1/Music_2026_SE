<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class CeciliaHallBooking extends Model
{
    protected $fillable = [
        'name',
        'email',
        'booker_type',
        'date',
        'start_time',
        'end_time',
        'purpose',
        'letter_path',
        'status',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason',
    ];

    /**
     * Check if this booking conflicts with existing approved bookings
     */
    public function hasConflict(): bool
    {
        return self::where('id', '!=', $this->id ?? 0)
            ->whereDate('date', $this->date)
            ->where('status', 'approved')
            ->where('start_time', '<', $this->end_time)
            ->where('end_time', '>', $this->start_time)
            ->exists();
    }

    /**
     * Get the user who approved this booking
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
