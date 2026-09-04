<?php

namespace App\Enums;

enum DamageSeverity: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Rendah (Low)',
            self::Medium => 'Sedang (Medium)',
            self::High => 'Tinggi (High)',
            self::Critical => 'Kritis (Critical)',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::Low => 'severity-low',
            self::Medium => 'severity-medium',
            self::High => 'severity-high',
            self::Critical => 'severity-critical',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
