<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'institution_id',
        'bank_account_id',
        'created_by',
        'beneficiary_id',
        'title',
        'description',
        'image',
        'goal_amount',
        'raised_amount',
        'campaign_type',
        'status',
        'priority',
        'end_date',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'goal_amount' => 'decimal:2',
        'raised_amount' => 'decimal:2',
        'end_date' => 'date',
        'approved_at' => 'datetime',
    ];

    protected $appends = ['days_left', 'progress_percentage', 'available_balance'];

    // Relationships
    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(CommitteeBankAccount::class, 'bank_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function beneficiary()
    {
        return $this->belongsTo(User::class, 'beneficiary_id');
    }

    public function donations()
    {
        return $this->hasMany(Donation::class);
    }

    public function approvals()
    {
        return $this->hasMany(CampaignApproval::class);
    }

    public function approvedByCommittee()
    {
        return $this->belongsTo(AlumniCommittee::class, 'approved_by');
    }

    public function withdrawalRequests()
    {
        return $this->hasMany(WithdrawalRequest::class);
    }

    // Accessors
    public function getDaysLeftAttribute()
    {
        if (!$this->end_date) {
            return null;
        }

        $now = now()->startOfDay();
        $endDate = Carbon::parse($this->end_date)->startOfDay();

        if ($endDate < $now) {
            return 0;
        }

        return (int) $now->diffInDays($endDate);
    }

    public function getProgressPercentageAttribute()
    {
        if ($this->goal_amount == 0) {
            return 0;
        }

        return min(($this->raised_amount / $this->goal_amount) * 100, 100);
    }

    public function getAvailableBalanceAttribute()
    {
        $totalWithdrawn = $this->withdrawalRequests()
            ->where('status', 'released')
            ->sum('amount');

        return $this->raised_amount - $totalWithdrawn;
    }
}
