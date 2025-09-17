<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class RepairApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'approved_by',
        'status',
        'admin_notes',
        'repair_notes',
        'approved_at',
        'completed_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the inspection that owns the repair approval.
     */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Get the admin who approved the repair.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the repair report.
     */
    public function repairReport(): HasOne
    {
        return $this->hasOne(RepairReport::class);
    }

    /**
     * Check if repair is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if repair is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if repair is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if repair is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Approve the repair.
     */
    public function approve(int $adminId, ?string $notes = null): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $adminId,
            'admin_notes' => $notes,
            'approved_at' => now(),
        ]);
    }

    /**
     * Reject the repair.
     */
    public function reject(int $adminId, ?string $notes = null): void
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $adminId,
            'admin_notes' => $notes,
        ]);
    }

    /**
     * Mark repair as completed.
     */
    public function markCompleted(?string $notes = null): void
    {
        $this->update([
            'status' => 'completed',
            'repair_notes' => $notes,
            'completed_at' => now(),
        ]);
    }
}
