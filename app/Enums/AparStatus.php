<?php

namespace App\Enums;

enum AparStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case NeedsRepair = 'needs_repair';
    case UnderRepair = 'under_repair';
    case NotFixable = 'not_fixable';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Aktif',
            self::Inactive => 'Non-Aktif',
            self::NeedsRepair => 'Perlu Perbaikan',
            self::UnderRepair => 'Sedang Diperbaiki',
            self::NotFixable => 'Tidak Dapat Diperbaiki',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::Active => 'status-active',
            self::Inactive => 'status-inactive',
            self::NeedsRepair => 'status-needs-repair',
            self::UnderRepair => 'status-under-repair',
            self::NotFixable => 'status-not-fixable',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
