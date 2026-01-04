<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Inspection extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'apar_id',
        'user_id',
        'photo_url',
        'selfie_url',
        'condition',
        'notes',
        'inspection_lat',
        'inspection_lng',
        'location_valid',
        'is_valid',
        'status',
        'inspection_status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'schedule_id',
        'repair_status',
        'repair_notes',
        'requires_repair',
        'photo_required',
        'selfie_required',
        'reinspection_count',
        'parent_inspection_id',
        'reinspection_reason',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'inspection_lat' => 'decimal:8',
            'inspection_lng' => 'decimal:8',
            'location_valid' => 'boolean',
            'is_valid' => 'boolean',
            'requires_repair' => 'boolean',
            'photo_required' => 'boolean',
            'selfie_required' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * Get the APAR that owns the inspection.
     */
    public function apar(): BelongsTo
    {
        return $this->belongsTo(Apar::class);
    }

    /**
     * Get the user that performed the inspection.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the inspection logs for the inspection.
     */
    public function inspectionLogs(): HasMany
    {
        return $this->hasMany(InspectionLog::class);
    }

    /**
     * Get the inspection damages for the inspection.
     */
    public function inspectionDamages(): HasMany
    {
        return $this->hasMany(InspectionDamage::class);
    }

    /**
     * Get the repair approval for the inspection.
     */
    public function repairApproval(): HasOne
    {
        return $this->hasOne(RepairApproval::class);
    }

    /**
     * Get the schedule that this inspection is related to.
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(InspectionSchedule::class, 'schedule_id');
    }

    /**
     * Check if inspection is valid.
     */
    public function isValid(): bool
    {
        return $this->is_valid;
    }

    /**
     * Check if location validation passed.
     */
    public function isLocationValid(): bool
    {
        return $this->location_valid;
    }

    /**
     * Check if inspection condition is good.
     */
    public function isConditionGood(): bool
    {
        return $this->condition === 'good';
    }

    /**
     * Check if inspection needs refill.
     */
    public function needsRefill(): bool
    {
        return $this->condition === 'needs_refill';
    }

    /**
     * Check if inspection is expired.
     */
    public function isExpired(): bool
    {
        return $this->condition === 'expired';
    }

    /**
     * Check if inspection is damaged.
     */
    public function isDamaged(): bool
    {
        return $this->condition === 'damaged';
    }

    /**
     * Check if inspection requires repair.
     */
    public function requiresRepair(): bool
    {
        return $this->requires_repair;
    }

    /**
     * Check if inspection is pending supervisor review.
     */
    public function isPendingReview(): bool
    {
        return $this->inspection_status === 'pending_review';
    }

    /**
     * Check if inspection is approved by supervisor.
     */
    public function isInspectionApproved(): bool
    {
        return $this->inspection_status === 'approved';
    }

    /**
     * Check if inspection is rejected by supervisor.
     */
    public function isInspectionRejected(): bool
    {
        return $this->inspection_status === 'rejected';
    }

    /**
     * Get the reviewer who approved/rejected the inspection.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Approve the inspection (by supervisor).
     */
    public function approveInspection(int $reviewerId, ?string $notes = null): void
    {
        $this->update([
            'inspection_status' => 'approved',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);
    }

    /**
     * Reject the inspection (by supervisor).
     */
    public function rejectInspection(int $reviewerId, string $notes): void
    {
        $this->update([
            'inspection_status' => 'rejected',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);
    }

    /**
     * Check if inspection has pending repair approval.
     */
    public function hasPendingRepairApproval(): bool
    {
        return $this->repair_status === 'pending_approval';
    }

    /**
     * Check if inspection has approved repair.
     */
    public function hasApprovedRepair(): bool
    {
        return $this->repair_status === 'approved';
    }

    /**
     * Check if inspection has completed repair.
     */
    public function hasCompletedRepair(): bool
    {
        return $this->repair_status === 'completed';
    }

    /**
     * Check if photo is required for this inspection.
     */
    public function isPhotoRequired(): bool
    {
        return $this->photo_required;
    }

    /**
     * Check if selfie is required for this inspection.
     */
    public function isSelfieRequired(): bool
    {
        return $this->selfie_required;
    }

    /**
     * Check if inspection needs re-inspection.
     */
    public function needsReinspection(): bool
    {
        return $this->status === 'needs_reinspection';
    }

    /**
     * Check if this is a re-inspection (has parent).
     */
    public function isReinspection(): bool
    {
        return !is_null($this->parent_inspection_id);
    }

    /**
     * Get the parent inspection if this is a re-inspection.
     */
    public function parentInspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class, 'parent_inspection_id');
    }

    /**
     * Get all re-inspections of this inspection.
     */
    public function reinspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'parent_inspection_id');
    }

    /**
     * Get re-inspection display text.
     */
    public function getReinspectionLabel(): string
    {
        if (!$this->isReinspection()) {
            return 'Inspeksi Awal';
        }
        
        return 'Inspeksi Ulang ke-' . $this->reinspection_count;
    }
}
