<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InspectionLog extends Model
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
        'inspection_id',
        'action',
        'lat',
        'lng',
        'ip_address',
        'user_agent',
        'device_info',
        'details',
        'is_successful',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'lat' => 'decimal:8',
            'lng' => 'decimal:8',
            'device_info' => 'array',
            'is_successful' => 'boolean',
        ];
    }

    /**
     * Get the APAR that owns the log.
     */
    public function apar(): BelongsTo
    {
        return $this->belongsTo(Apar::class);
    }

    /**
     * Get the user that performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the inspection that owns the log.
     */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Check if log action was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->is_successful;
    }

    /**
     * Check if log action was a scan.
     */
    public function isScanAction(): bool
    {
        return $this->action === 'scan_qr';
    }

    /**
     * Check if log action was an inspection start.
     */
    public function isInspectionStart(): bool
    {
        return $this->action === 'start_inspection';
    }

    /**
     * Check if log action was an inspection submission.
     */
    public function isInspectionSubmit(): bool
    {
        return $this->action === 'submit_inspection';
    }

    /**
     * Check if log action was a validation failure.
     */
    public function isValidationFailed(): bool
    {
        return $this->action === 'validation_failed';
    }
}
