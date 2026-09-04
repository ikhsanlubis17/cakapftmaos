<?php

namespace App\Enums;

enum InspectionCondition: string
{
    case Good = 'good';
    case Damaged = 'damaged';
    case NeedsRefill = 'needs_refill';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Good => 'Baik (Normal)',
            self::Damaged => 'Rusak',
            self::NeedsRefill => 'Perlu Isi Ulang',
            self::Expired => 'Kadaluarsa',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
