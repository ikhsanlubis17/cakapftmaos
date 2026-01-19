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
        'admin_notes', // Deprecated - use supervisor_notes
        'supervisor_notes',
        'rejection_reason',
        'repair_notes',
        'approved_at',
        'decision_made_at',
        'completed_at',
        'scheduled_at',
        'assigned_technician_id',
        'schedule_notes',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'decision_made_at' => 'datetime',
        'completed_at' => 'datetime',
        'scheduled_at' => 'datetime',
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
     * Get the assigned technician.
     */
    public function assignedTechnician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
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
    public function approve(int $adminId, string $supervisorNotes): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $adminId,
            'supervisor_notes' => $supervisorNotes,
            'admin_notes' => $supervisorNotes, // Keep for backward compatibility
            'approved_at' => now(),
            'decision_made_at' => now(),
        ]);
    }

    /**
     * Reject the repair.
     */
    public function reject(int $adminId, string $supervisorNotes, string $rejectionReason): void
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $adminId,
            'supervisor_notes' => $supervisorNotes,
            'rejection_reason' => $rejectionReason,
            'admin_notes' => $supervisorNotes, // Keep for backward compatibility
            'decision_made_at' => now(),
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

    /**
     * Check if supervisor notes exist.
     */
    public function hasSupervisorNotes(): bool
    {
        return !empty($this->supervisor_notes);
    }

    /**
     * Get the supervisor who made the decision.
     */
    public function getDecisionMaker()
    {
        return $this->approver;
    }

    /**
     * Get formatted decision time.
     */
    public function getDecisionTime(): ?string
    {
        return $this->decision_made_at ? $this->decision_made_at->diffForHumans() : null;
    }
    /**
     * Mark repair as scheduled.
     */
    public function markScheduled($scheduledAt, int $technicianId, ?string $notes = null): void
    {
        $this->update([
            'scheduled_at' => $scheduledAt,
            'assigned_technician_id' => $technicianId,
            'schedule_notes' => $notes,
        ]);
    }
}
