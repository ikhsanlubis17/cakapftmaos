<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RepairReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'repair_approval_id',
        'reported_by',
        'repair_description',
        'before_photo_url',
        'after_photo_url',
        'repair_lat',
        'repair_lng',
        'repair_completed_at',
    ];

    protected $casts = [
        'repair_lat' => 'decimal:8',
        'repair_lng' => 'decimal:8',
        'repair_completed_at' => 'datetime',
    ];

    /**
     * Get the repair approval that owns the report.
     */
    public function repairApproval(): BelongsTo
    {
        return $this->belongsTo(RepairApproval::class);
    }

    /**
     * Get the user who reported the repair.
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Get the inspection through repair approval.
     */
    public function inspection(): BelongsTo
    {
        return $this->repairApproval->inspection;
    }
}
