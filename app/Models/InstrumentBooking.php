<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstrumentBooking extends Model
{
    use HasFactory;

    protected $table = 'instrument_bookings';
    protected $primaryKey = 'booking_id';

    protected $fillable = [
        'student_id',
        'instrument_id',
        'instrument_no',
        'instrument_type',
        'booking_date',
        'time_in',
        'end_time',
        'status',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'student_id');
    }
}
