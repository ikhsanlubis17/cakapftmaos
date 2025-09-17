<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class InspectionSchedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'apar_id',
        'assigned_user_id',
        'scheduled_date',
        'scheduled_time',
        'start_time',
        'end_time',
        'frequency',
        'auto_reminder',
        'reminder_days_before',
        'is_active',
        'is_completed',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'scheduled_time' => 'datetime:H:i:s',
            'start_time' => 'string',
            'end_time' => 'string',
            'auto_reminder' => 'boolean',
            'reminder_days_before' => 'integer',
            'is_active' => 'boolean',
            'is_completed' => 'boolean',
        ];
    }

    /**
     * Get the APAR that owns the schedule.
     */
    public function apar(): BelongsTo
    {
        return $this->belongsTo(Apar::class);
    }

    /**
     * Get the assigned user for the schedule.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * Get the inspections for this schedule.
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'schedule_id');
    }

    /**
     * Check if schedule is active.
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if inspection is overdue.
     */
    public function isOverdue(): bool
    {
        $now = Carbon::now();
        $scheduledDate = $this->scheduled_date;
        $startTime = $this->start_time;
        
        // Check if date is past
        if (Carbon::parse($scheduledDate)->isPast()) {
            return true;
        }
        
        // Check if today but start time has passed
        if (Carbon::parse($scheduledDate)->isToday()) {
            $today = $now->format('Y-m-d');
            $scheduledDateTime = Carbon::parse($today . ' ' . $startTime);
            return $scheduledDateTime->isPast();
        }
        
        return false;
    }

    /**
     * Check if inspection is due today.
     */
    public function isDueToday(): bool
    {
        return Carbon::parse($this->scheduled_date)->isToday();
    }

    /**
     * Check if inspection is due within days.
     */
    public function isDueWithinDays(int $days): bool
    {
        return Carbon::parse($this->scheduled_date)->diffInDays(now()) <= $days;
    }

    /**
     * Check if current time is within inspection window.
     */
    public function isWithinInspectionWindow(): bool
    {
        $now = Carbon::now();
        $scheduledTime = Carbon::parse($this->scheduled_date . ' ' . $this->scheduled_time);
        
        // Allow 30 minutes before and after scheduled time
        $startTime = $scheduledTime->copy()->subMinutes(30);
        $endTime = $scheduledTime->copy()->addMinutes(30);

        return $now->between($startTime, $endTime);
    }

    /**
     * Check if inspection is ongoing (today and within time window).
     */
    public function isOngoing(): bool
    {
        $now = Carbon::now();
        $scheduledDate = $this->scheduled_date;
        $startTime = $this->start_time;
        $endTime = $this->end_time;
        
        // Check if today
        if (!Carbon::parse($scheduledDate)->isToday()) {
            return false;
        }
        
        // Check if within time window
        $today = $now->format('Y-m-d');
        $scheduledStartTime = Carbon::parse($today . ' ' . $startTime);
        $scheduledEndTime = Carbon::parse($today . ' ' . $endTime);
        
        return $now->between($scheduledStartTime, $scheduledEndTime);
    }

    /**
     * Check if inspection is upcoming (future or today but not started).
     */
    public function isUpcoming(): bool
    {
        $now = Carbon::now();
        $scheduledDate = $this->scheduled_date;
        $startTime = $this->start_time;
        
        // Check if future date
        if (Carbon::parse($scheduledDate)->isFuture()) {
            return true;
        }
        
        // Check if today but not started yet (and not overdue)
        if (Carbon::parse($scheduledDate)->isToday()) {
            $today = $now->format('Y-m-d');
            $scheduledDateTime = Carbon::parse($today . ' ' . $startTime);
            return $scheduledDateTime->isFuture();
        }
        
        return false;
    }

    /**
     * Get current status of the schedule.
     */
    public function getCurrentStatus(): string
    {
        if (!$this->is_active) {
            return 'inactive';
        }
        
        // Priority order: overdue > ongoing > upcoming
        if ($this->isOverdue()) {
            return 'overdue';
        }
        
        if ($this->isOngoing()) {
            return 'ongoing';
        }
        
        if ($this->isUpcoming()) {
            return 'upcoming';
        }
        
        return 'unknown';
    }

    /**
     * Get days until next inspection.
     */
    public function daysUntilNextInspection(): int
    {
        return Carbon::parse($this->scheduled_date)->diffInDays(now());
    }
}
