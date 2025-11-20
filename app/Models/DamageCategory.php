<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DamageCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'type',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get available damage category types from apar_types table.
     */
    public static function getTypes(): array
    {
        return \App\Models\AparType::active()
            ->pluck('name')
            ->toArray();
    }

    /**
     * Get the inspection damages for this category.
     */
    public function inspectionDamages(): HasMany
    {
        return $this->hasMany(InspectionDamage::class);
    }

    /**
     * Scope to get only active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }
}
