<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_code',
        'name',
        'category',
        'office',
        'description',
        'date_acquired',
        'value',
        'is_borrowable',
        'status',
        'repair_description',
        'repair_image',
    ];
}