<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class CommitteeBankAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'committee_id',
        'institution_id',
        'bank_name',
        'account_number',
        'account_holder',
        'swift_code',
        'branch',
        'is_primary',
        'status',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'effective_from' => 'date',
        'effective_until' => 'date',
    ];

    protected $hidden = [
        'account_number',
    ];

    protected $appends = ['masked_account_number'];

    protected function accountNumber(): Attribute
    {
        return Attribute::make(
            get: fn($value) => decrypt($value),
            set: fn($value) => encrypt($value),
        );
    }

    public function committee()
    {
        return $this->belongsTo(AlumniCommittee::class, 'committee_id');
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function withdrawalRequests()
    {
        return $this->hasMany(WithdrawalRequest::class, 'bank_account_id');
    }

    public function getMaskedAccountNumberAttribute()
    {
        $number = $this->account_number;

        if (strlen($number) <= 4) {
            return $number;
        }

        return str_repeat('*', strlen($number) - 4) . substr($number, -4);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('effective_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('effective_until')
                    ->orWhere('effective_until', '>=', now());
            });
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    public function scopeForInstitution($query, $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    public function scopeForCommittee($query, $committeeId)
    {
        return $query->where('committee_id', $committeeId);
    }

    public function isEffective()
    {
        $now = now();

        if ($this->effective_from > $now) {
            return false;
        }

        if ($this->effective_until && $this->effective_until < $now) {
            return false;
        }

        return true;
    }

    public function canBeUsedForWithdrawals()
    {
        return $this->status === 'active' && $this->isEffective();
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($bankAccount) {
            if ($bankAccount->is_primary && $bankAccount->isDirty('is_primary')) {
                static::where('institution_id', $bankAccount->institution_id)
                    ->where('id', '!=', $bankAccount->id)
                    ->update(['is_primary' => false]);
            }
        });
    }
}
