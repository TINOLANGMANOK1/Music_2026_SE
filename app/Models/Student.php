<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $table = 'student';
    protected $primaryKey = 'student_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'student_id',
        'rfid_uid',
        'first_name',
        'last_name',
        'middle_initial',
        'mtl_time_remaining',
        'year',
        'sec',
    ];

    protected $casts = [
        'mtl_time_remaining' => 'integer',
        'year' => 'integer',
    ];
}
