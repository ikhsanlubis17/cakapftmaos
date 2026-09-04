<?php

namespace App\Enums;

enum InspectionStatus: string
{
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::PendingReview => 'Menunggu Review',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::PendingReview => 'status-pending',
            self::Approved => 'status-approved',
            self::Rejected => 'status-rejected',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
