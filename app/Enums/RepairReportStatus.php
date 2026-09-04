<?php

namespace App\Enums;

enum RepairReportStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rework = 'rework';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu Review',
            self::Approved => 'Disetujui',
            self::Rework => 'Perlu Perbaikan Ulang',
            self::Rejected => 'Ditolak',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
