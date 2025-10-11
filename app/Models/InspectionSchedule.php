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
        'start_at',
        'end_at',
        'frequency',
        'auto_reminder',
        'reminder_days_before',
        'is_active',
        'is_completed',
        'notes',
    ];

    /**
     * Attributes appended to array / JSON responses for backwards compatibility.
     *
     * @var list<string>
     */
    protected $appends = [
        'scheduled_date',
        'scheduled_time',
        'start_time',
        'end_time',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
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
        $endAt = $this->end_at;

        if (!$endAt instanceof Carbon) {
            return false;
        }

        return $this->nowUtc()->greaterThan($endAt->copy()->setTimezone('UTC'));
    }

    /**
     * Check if inspection is due today.
     */
    public function isDueToday(): bool
    {
        $startAtLocal = $this->startAtLocal();

        return $startAtLocal ? $startAtLocal->isToday() : false;
    }

    /**
     * Check if inspection is due within days.
     */
    public function isDueWithinDays(int $days): bool
    {
        $startAtLocal = $this->startAtLocal();

        if (!$startAtLocal) {
            return false;
        }

        return $startAtLocal->diffInDays($this->nowLocal()) <= $days;
    }

    /**
     * Check if current time is within inspection window.
     */
    public function isWithinInspectionWindow(): bool
    {
        $now = $this->nowUtc();
        $startAt = $this->startAtUtc();

        if (!$startAt) {
            return false;
        }

        $windowStart = $startAt->copy()->subMinutes(30);
        $windowEnd = $startAt->copy()->addMinutes(30);

        $endAt = $this->endAtUtc();
        if ($endAt && $windowEnd->greaterThan($endAt)) {
            $windowEnd = $endAt;
        }

        return $now->between($windowStart, $windowEnd);
    }

    /**
     * Check if inspection is ongoing (today and within time window).
     */
    public function isOngoing(): bool
    {
        $startAt = $this->startAtUtc();
        $endAt = $this->endAtUtc();

        if (!$startAt || !$endAt) {
            return false;
        }

        return $this->nowUtc()->between($startAt, $endAt);
    }

    /**
     * Check if inspection is upcoming (future or today but not started).
     */
    public function isUpcoming(): bool
    {
        $startAt = $this->startAtUtc();

        if (!$startAt) {
            return false;
        }

        return $startAt->greaterThan($this->nowUtc());
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
        $startAtLocal = $this->startAtLocal();

        if (!$startAtLocal) {
            return 0;
        }

        return $startAtLocal->diffInDays($this->nowLocal());
    }

    /**
     * Derive scheduled date from the stored UTC start timestamp.
     */
    public function getScheduledDateAttribute(): ?string
    {
        $startAtLocal = $this->startAtLocal();

        return $startAtLocal ? $startAtLocal->toDateString() : null;
    }

    /**
     * Derive scheduled time (backwards compatibility with legacy field).
     */
    public function getScheduledTimeAttribute(): ?string
    {
        $startAtLocal = $this->startAtLocal();

        return $startAtLocal ? $startAtLocal->format('H:i:s') : null;
    }

    /**
     * Alias for start time to satisfy existing consumers.
     */
    public function getStartTimeAttribute(): ?string
    {
        $startAtLocal = $this->startAtLocal();

        return $startAtLocal ? $startAtLocal->format('H:i:s') : null;
    }

    /**
     * Alias for end time to satisfy existing consumers.
     */
    public function getEndTimeAttribute(): ?string
    {
        $endAtLocal = $this->endAtLocal();

        return $endAtLocal ? $endAtLocal->format('H:i:s') : null;
    }

    /**
     * Retrieve the stored start time in UTC.
     */
    public function startAtUtc(): ?Carbon
    {
        return $this->start_at ? $this->start_at->copy()->setTimezone('UTC') : null;
    }

    /**
     * Retrieve the stored end time in UTC.
     */
    public function endAtUtc(): ?Carbon
    {
        return $this->end_at ? $this->end_at->copy()->setTimezone('UTC') : null;
    }

    /**
     * Retrieve the start time in the configured application timezone.
     */
    public function startAtLocal(): ?Carbon
    {
        return $this->start_at ? $this->start_at->copy()->setTimezone($this->displayTimezone()) : null;
    }

    /**
     * Retrieve the end time in the configured application timezone.
     */
    public function endAtLocal(): ?Carbon
    {
        return $this->end_at ? $this->end_at->copy()->setTimezone($this->displayTimezone()) : null;
    }

    /**
     * Provide the current time in UTC.
     */
    protected function nowUtc(): Carbon
    {
        return Carbon::now('UTC');
    }

    /**
     * Provide the current time in local display timezone.
     */
    protected function nowLocal(): Carbon
    {
        return Carbon::now($this->displayTimezone());
    }

    /**
     * Resolve the display timezone used for conversions.
     */
    protected function displayTimezone(): string
    {
        return config('app.display_timezone', config('app.timezone', 'UTC'));
    }
}
