<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AlumniCommittee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'institution_id',
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function members()
    {
        return $this->hasMany(CommitteeMember::class, 'committee_id');
    }

    public function activeMembers()
    {
        return $this->members()->where('status', 'active')->whereNull('left_at');
    }

    public function bankAccounts()
    {
        return $this->hasMany(CommitteeBankAccount::class);
    }


    public function activeBankAccounts()
    {
        return $this->bankAccounts()->where('status', 'active');
    }

    public function primaryBankAccount()
    {
        return $this->bankAccounts()->where('is_primary', true)->where('status', 'active')->first();
    }

    public function approvedCampaigns()
    {
        return $this->hasMany(Campaign::class, 'approved_by');
    }

    public function withdrawalRequests()
    {
        return $this->hasMany(WithdrawalRequest::class, 'committee_id');
    }
}
