<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InspectionDamage extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'damage_category_id',
        'notes',
        'damage_photo_url',
        'severity',
    ];

    protected $casts = [
        'severity' => 'string',
    ];

    /**
     * Get the inspection that owns the damage.
     */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Get the damage category.
     */
    public function damageCategory(): BelongsTo
    {
        return $this->belongsTo(DamageCategory::class);
    }

    /**
     * Get severity level as human readable text.
     */
    public function getSeverityTextAttribute(): string
    {
        return match($this->severity) {
            'low' => 'Rendah',
            'medium' => 'Sedang',
            'high' => 'Tinggi',
            'critical' => 'Kritis',
            default => 'Tidak Diketahui'
        };
    }
}
