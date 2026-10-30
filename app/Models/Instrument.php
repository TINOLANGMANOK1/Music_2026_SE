<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Instrument extends Model
{
    use HasFactory;

    protected $table = 'instrument_info';
    protected $primaryKey = 'instrument_id';
    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'instrument_id',
        'instrument_type_id',
        'instrument_type',
        'instrument_no',
        'status',
        'brand',
        'description',
        'image_url',
        'barcode',
    ];

    public function booking()
    {
        return $this->hasOne(InstrumentBooking::class, 'instrument_id', 'instrument_id')->where('status', 'Active');
    }
}
