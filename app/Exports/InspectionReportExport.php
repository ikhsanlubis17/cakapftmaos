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

class InspectionReportExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['inspections'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal Inspeksi',
            'Waktu Inspeksi',
            'Serial Number APAR',
            'Lokasi APAR',
            'Tipe APAR',
            'Kapasitas',
            'Status APAR',
            'Teknisi',
            'Kondisi APAR',
            'Catatan',
        ];
    }

    public function map($inspection): array
    {
        static $rowNumber = 1;
        $apar = $inspection->apar;
        $type = $apar?->aparType?->name ?? $apar?->type ?? '-';
        $status = $apar ? getAparStatusLabel($apar->status) : '-';
        
        return [
            $rowNumber++,
            $inspection->created_at ? Carbon::parse($inspection->created_at)->format('d/m/Y') : '-',
            $inspection->created_at ? Carbon::parse($inspection->created_at)->format('H:i') : '-',
            $apar ? $apar->serial_number : '-',
            $apar ? $apar->location_name : '-',
            strtoupper((string) $type),
            $apar ? ($apar->capacity ? $apar->capacity . ' kg' : '-') : '-',
            $status,
            $inspection->user ? $inspection->user->name : '-',
            $inspection->condition === 'good' ? 'Baik' : 'Rusak',
            $inspection->notes ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Laporan Inspeksi';
    }

    public function styles(Worksheet $sheet)
    {
        // Auto-size columns
        foreach (range('A', 'K') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Add title and period info
        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:K1');
        $sheet->setCellValue('A1', $this->data['title'] ?? 'Laporan Inspeksi APAR');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14,
                'color' => ['rgb' => '041562'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A2:K2');
        $sheet->setCellValue('A2', 'Periode: ' . ($this->data['period'] ?? '-'));
        $sheet->getStyle('A2')->applyFromArray([
            'font' => [
                'size' => 11,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A3:K3');
        $sheet->setCellValue('A3', 'Total Inspeksi: ' . ($this->data['total_inspections'] ?? 0) . ' | Dibuat pada: ' . ($this->data['generated_at'] ?? '-'));
        $sheet->getStyle('A3')->applyFromArray([
            'font' => [
                'size' => 9,
                'italic' => true,
                'color' => ['rgb' => '64748B'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Adjust header row position at Row 4
        $sheet->getStyle('A4:K4')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 10,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '041562'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(25);

        // Data rows borders
        $highestRow = $sheet->getHighestRow();
        for ($r = 5; $r <= $highestRow; $r++) {
            $sheet->getStyle("A{$r}:C{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G{$r}:H{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$r}:K{$r}")->applyFromArray([
                'borders' => [
                    'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
            ]);
        }

        return $sheet;
    }
}
