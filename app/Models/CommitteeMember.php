<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CommitteeMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'committee_id',
        'user_id',
        'role',
        'approval_privileges',
        'joined_at',
        'left_at',
        'status',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'approval_privileges' => 'boolean',
    ];

    public function committee()
    {
        return $this->belongsTo(AlumniCommittee::class, 'committee_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function campaignApprovals()
    {
        return $this->hasMany(CampaignApproval::class);
    }

    public function withdrawalApprovals()
    {
        return $this->hasMany(WithdrawalApproval::class);
    }

    public function requestedWithdrawals()
    {
        return $this->hasMany(WithdrawalRequest::class, 'requested_by');
    }

    public function canApprove()
    {
        return $this->approval_privileges && $this->status === 'active' && !$this->left_at;
    }
}
