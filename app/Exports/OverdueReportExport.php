<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class OverdueReportExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['overdue_schedules'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'Batas Waktu Jadwal',
            'No. Seri APAR',
            'Lokasi APAR',
            'Tipe APAR',
            'Petugas Ditugaskan',
            'Frekuensi',
            'Hari Terlambat',
            'Catatan',
        ];
    }

    public function map($schedule): array
    {
        static $rowNumber = 1;
        $apar = $schedule->apar;
        $type = $apar?->aparType?->name ?? $apar?->type ?? '-';
        $startAt = $schedule->start_at ? Carbon::parse($schedule->start_at) : null;
        $daysOverdue = $startAt ? (int) $startAt->diffInDays(now()) : 0;
        
        return [
            $rowNumber++,
            $startAt ? $startAt->format('d/m/Y H:i') : '-',
            $apar ? $apar->serial_number : '-',
            $apar ? $apar->location_name : '-',
            strtoupper((string) $type),
            $schedule->assignedUser ? $schedule->assignedUser->name : 'Belum Ditugaskan',
            getFrequencyLabel($schedule->frequency ?? 'monthly'),
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
        // Auto-size columns
        foreach (range('A', 'I') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Add title and period info
        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:I1');
        $sheet->setCellValue('A1', $this->data['title'] ?? 'Laporan Jadwal Terlambat');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14,
                'color' => ['rgb' => 'DA1212'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A2:I2');
        $sheet->setCellValue('A2', 'Total Terlambat: ' . ($this->data['total_overdue'] ?? 0) . ' Jadwal | Waktu Unduh: ' . ($this->data['generated_at'] ?? '-'));
        $sheet->getStyle('A2')->applyFromArray([
            'font' => [
                'size' => 10,
                'italic' => true,
                'color' => ['rgb' => '64748B'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Adjust header row position at Row 4
        $sheet->getStyle('A4:I4')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 10,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'DA1212'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(25);

        $highestRow = $sheet->getHighestRow();
        for ($r = 5; $r <= $highestRow; $r++) {
            $sheet->getStyle("A{$r}:B{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G{$r}:H{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$r}:I{$r}")->applyFromArray([
                'borders' => [
                    'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
            ]);
        }

        return $sheet;
    }
}
