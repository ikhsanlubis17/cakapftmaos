<?php

namespace App\Enums;

enum ScheduleFrequency: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case Quarterly = 'quarterly';
    case Yearly = 'yearly';
    case Once = 'once';

    public function label(): string
    {
        return match ($this) {
            self::Daily => 'Harian',
            self::Weekly => 'Mingguan',
            self::Monthly => 'Bulanan',
            self::Quarterly => 'Triwulanan',
            self::Yearly => 'Tahunan',
            self::Once => 'Sekali',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
