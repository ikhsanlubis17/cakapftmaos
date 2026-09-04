<?php

namespace App\Enums;

enum AparLocationType: string
{
    case Statis = 'statis';
    case Mobile = 'mobile';

    public function label(): string
    {
        return match ($this) {
            self::Statis => 'Statis',
            self::Mobile => 'Mobile',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
