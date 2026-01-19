<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WithdrawalApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'withdrawal_request_id',
        'user_id',
        'status',
        'comments',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function withdrawalRequest()
    {
        return $this->belongsTo(WithdrawalRequest::class);
    }

    public function committeeMember()
    {
        return $this->belongsTo(CommitteeMember::class);
    }
}
