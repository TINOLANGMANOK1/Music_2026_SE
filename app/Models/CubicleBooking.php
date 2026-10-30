<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CubicleBooking extends Model
{
    protected $table = 'cubicle_bookings';
    protected $primaryKey = 'booking_id';
    public $timestamps = false;

    protected $fillable = ['time_out', 'status'];
}
