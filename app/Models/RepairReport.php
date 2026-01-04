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
        'status',
        'supervisor_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'repair_lat' => 'decimal:8',
        'repair_lng' => 'decimal:8',
        'repair_completed_at' => 'datetime',
        'reviewed_at' => 'datetime',
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
     * Get the supervisor who reviewed the report.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the inspection through repair approval.
     */
    public function inspection(): BelongsTo
    {
        return $this->repairApproval->inspection;
    }

    /**
     * Check if report is pending review.
     */
    public function isPendingReview(): bool
    {
        return $this->status === 'pending_review';
    }

    /**
     * Check if report is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if report needs rework.
     */
    public function needsRework(): bool
    {
        return $this->status === 'needs_rework';
    }

    /**
     * Check if report is rejected (not fixable).
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Approve the repair report.
     */
    public function approve(int $reviewerId, ?string $notes = null): void
    {
        $this->update([
            'status' => 'approved',
            'supervisor_notes' => $notes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Mark report as needs rework.
     */
    public function markNeedsRework(int $reviewerId, string $notes): void
    {
        $this->update([
            'status' => 'needs_rework',
            'supervisor_notes' => $notes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Reject the repair report (APAR not fixable).
     */
    public function reject(int $reviewerId, string $notes): void
    {
        $this->update([
            'status' => 'rejected',
            'supervisor_notes' => $notes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);
    }
}
