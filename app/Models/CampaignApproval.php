<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CampaignApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'user_id',
        'status',
        'comments',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function committeeMember()
    {
        return $this->belongsTo(CommitteeMember::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
