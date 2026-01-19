<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WithdrawalRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'campaign_id',
        'committee_id',
        'requested_by',
        'bank_account_id',
        'amount',
        'purpose',
        'status',
        'requested_at',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function committee()
    {
        return $this->belongsTo(AlumniCommittee::class, 'committee_id');
    }

    public function requester()
    {
        return $this->belongsTo(CommitteeMember::class, 'requested_by');
    }

    public function bankAccount()
    {
        return $this->belongsTo(CommitteeBankAccount::class);
    }

    public function approvals()
    {
        return $this->hasMany(WithdrawalApproval::class);
    }
}
