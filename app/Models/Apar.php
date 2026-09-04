<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Apar extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'serial_number',
        'qr_code',
        'location_type',
        'location_name',
        'latitude',
        'longitude',
        'valid_radius',
        'apar_type_id',
        'capacity',
        'manufactured_date',
        'expired_at',
        'status',
        'tank_truck_id',
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
            'manufactured_date' => 'date',
            'expired_at' => 'date',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'valid_radius' => 'integer',
            'capacity' => 'integer',
            'status' => \App\Enums\AparStatus::class,
        ];
    }

    /**
     * Get the tank truck that owns the APAR.
     */
    public function tankTruck(): BelongsTo
    {
        return $this->belongsTo(TankTruck::class);
    }

    /**
     * Get the APAR type.
     */
    public function aparType(): BelongsTo
    {
        return $this->belongsTo(AparType::class);
    }

    /**
     * Get the inspections for the APAR.
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class);
    }

    /**
     * Get the inspection logs for the APAR.
     */
    public function inspectionLogs(): HasMany
    {
        return $this->hasMany(InspectionLog::class);
    }

    /**
     * Get the inspection schedules for the APAR.
     */
    public function inspectionSchedules(): HasMany
    {
        return $this->hasMany(InspectionSchedule::class);
    }

    /**
     * Alias for backward compatibility
     */
    public function inspectionSchedule(): HasMany
    {
        return $this->inspectionSchedules();
    }

    /**
     * Get the latest inspection for the APAR.
     */
    public function latestInspection(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Inspection::class)->latestOfMany();
    }

    /**
     * Check if APAR is static (not mobile).
     */
    public function isStatic(): bool
    {
        return $this->location_type === 'statis';
    }

    /**
     * Check if APAR is mobile.
     */
    public function isMobile(): bool
    {
        return $this->location_type === 'mobile';
    }

    /**
     * Check if APAR is expired.
     */
    public function isExpired(): bool
    {
        return $this->expired_at->isPast();
    }

    /**
     * Check if APAR will expire soon (within 30 days).
     */
    public function willExpireSoon(): bool
    {
        return $this->expired_at->diffInDays(now()) <= 30;
    }

    /**
     * Check if APAR is active.
     */
    public function isActive(): bool
    {
        return $this->status === \App\Enums\AparStatus::Active || $this->status === 'active';
    }

    /**
     * Check if APAR needs repair.
     */
    public function needsRepair(): bool
    {
        return $this->status === \App\Enums\AparStatus::NeedsRepair || $this->status === 'needs_repair';
    }

    /**
     * Check if APAR is under repair.
     */
    public function isUnderRepair(): bool
    {
        return $this->status === \App\Enums\AparStatus::UnderRepair || $this->status === 'under_repair';
    }

    /**
     * Check if APAR is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status === \App\Enums\AparStatus::Inactive || $this->status === 'inactive';
    }

    /**
     * Check if APAR is not fixable.
     */
    public function isNotFixable(): bool
    {
        return $this->status === \App\Enums\AparStatus::NotFixable || $this->status === 'not_fixable';
    }

    /**
     * Get days until expiration.
     */
    public function daysUntilExpiration(): int
    {
        return $this->expired_at->diffInDays(now());
    }

    /**
     * Calculate distance from given coordinates (Haversine formula).
     */
    public function distanceFrom(float $lat, float $lng): float
    {
        if (!$this->latitude || !$this->longitude) {
            return 0;
        }

        $earthRadius = 6371000; // Earth's radius in meters

        $latDelta = deg2rad($lat - $this->latitude);
        $lngDelta = deg2rad($lng - $this->longitude);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($this->latitude)) * cos(deg2rad($lat)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Check if given coordinates are within valid radius.
     */
    public function isWithinValidRadius(float $lat, float $lng): bool
    {
        if ($this->isMobile()) {
            return true; // Mobile APARs don't require GPS validation
        }

        $distance = $this->distanceFrom($lat, $lng);
        return $distance <= $this->valid_radius;
    }
}
