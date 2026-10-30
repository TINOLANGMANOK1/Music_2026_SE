<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tool extends Model
{
    use HasFactory;

    protected $table = 'tools_info';
    protected $primaryKey = 'tool_id';
    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'tool_id',
        'tool_type',
        'tool_no',
        'status',
        'brand',
        'description',
        'image_url',
        'barcode',
    ];

    public function booking()
    {
        return $this->hasOne(ToolBooking::class, 'tool_id', 'tool_id')->where('status', 'Active');
    }
}
