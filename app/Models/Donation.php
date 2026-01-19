<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Donation extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'campaign_id',
        'user_id',
        'donor_name',
        'donor_email',
        'amount',
        'status',
        'payment_method',
        'transaction_id',
        'is_anonymous',
        'message',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_anonymous' => 'boolean',
    ];

    protected $appends = ['donor_display_name'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getDonorDisplayNameAttribute()
    {
        if ($this->is_anonymous) {
            return 'Anonymous Donor';
        }

        if ($this->user) {
            return $this->user->name;
        }

        return $this->donor_name ?: 'Anonymous';
    }
}
