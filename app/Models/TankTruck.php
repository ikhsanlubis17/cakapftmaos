<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TankTruck extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'plate_number',
        'driver_name',
        'driver_phone',
        'description',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    /**
     * Get the APARs for the tank truck.
     */
    public function apars(): HasMany
    {
        return $this->hasMany(Apar::class);
    }

    /**
     * Check if tank truck is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
