<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Institution extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'status',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function donations()
    {
        return $this->hasMany(Donation::class);
    }

    public function alumniCommittees()
    {
        return $this->hasMany(AlumniCommittee::class);
    }

    public function activeCommittee()
    {
        return $this->hasOne(AlumniCommittee::class)
            ->where('status', 'active')
            ->whereNull('end_date')
            ->orWhere('end_date', '>=', now());
    }
}
