<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'institution_id',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'bio',
        'avatar',
        'address',
        'city',
        'country',
        'date_of_birth',
        'gender',
        'status',
        'last_login_at',
        'device_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_login_at' => 'datetime',
        'date_of_birth' => 'date',
    ];

    protected $appends = ['name'];

    public function getNameAttribute()
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function createdCampaigns()
    {
        return $this->hasMany(Campaign::class, 'created_by');
    }

    public function beneficiaryCampaigns()
    {
        return $this->hasMany(Campaign::class, 'beneficiary_id');
    }

    public function donations()
    {
        return $this->hasMany(Donation::class);
    }

    public function committeeMemberships()
    {
        return $this->hasMany(CommitteeMember::class);
    }

    public function activeCommitteeMemberships()
    {
        return $this->committeeMemberships()->where('status', 'active');
    }

    public function isSystemAdmin()
    {
        return $this->hasRole('system_admin');
    }

    public function isInstitutionAdmin()
    {
        return $this->hasRole('institution_admin');
    }

    public function isCommitteeMember()
    {
        return $this->hasRole('committee_member');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token, $this->email));
    }
}
