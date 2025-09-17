<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;
use Carbon\Carbon;

class OverdueReportExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['overdue_schedules'];
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal Jadwal',
            'Waktu Jadwal',
            'Serial Number APAR',
            'Lokasi APAR',
            'Tipe APAR',
            'Teknisi',
            'Frekuensi',
            'Hari Terlambat',
            'Catatan',
        ];
    }

    public function map($schedule): array
    {
        static $rowNumber = 1;
        $scheduledDate = Carbon::parse($schedule->scheduled_date);
        $daysOverdue = $scheduledDate->diffInDays(now());
        
        return [
            $rowNumber++,
            $scheduledDate->format('d/m/Y'),
            $schedule->scheduled_time,
            $schedule->apar ? $schedule->apar->serial_number : '-',
            $schedule->apar ? $schedule->apar->location_name : '-',
            $schedule->apar ? strtoupper($schedule->apar->type) : '-',
            $schedule->assignedUser ? $schedule->assignedUser->name : '-',
            $this->getFrequencyText($schedule->frequency),
            $daysOverdue . ' hari',
            $schedule->notes ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Laporan Terlambat';
    }

    public function styles(Worksheet $sheet)
    {
        // Header styling
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'DC2626'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Auto-size columns
        foreach (range('A', 'J') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Add title and period info
        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', $this->data['title']);
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 16,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Total Jadwal Terlambat: ' . $this->data['total_overdue']);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => [
                'size' => 12,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A3:J3');
        $sheet->setCellValue('A3', 'Dibuat pada: ' . $this->data['generated_at']);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => [
                'size' => 10,
                'italic' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Adjust header row position
        $sheet->getStyle('A4:J4')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'DC2626'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        return $sheet;
    }

    private function getFrequencyText($frequency)
    {
        switch ($frequency) {
            case 'daily':
                return 'Harian';
            case 'weekly':
                return 'Mingguan';
            case 'monthly':
                return 'Bulanan';
            default:
                return $frequency;
        }
    }
}
