<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Supervisor = 'supervisor';
    case Teknisi = 'teknisi';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Supervisor => 'Supervisor',
            self::Teknisi => 'Teknisi',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
