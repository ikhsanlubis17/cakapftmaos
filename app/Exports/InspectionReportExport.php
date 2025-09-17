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

class InspectionReportExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['inspections'];
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
        
        return [
            $rowNumber++,
            $inspection->created_at ? Carbon::parse($inspection->created_at)->format('d/m/Y') : '-',
            $inspection->created_at ? Carbon::parse($inspection->created_at)->format('H:i') : '-',
            $inspection->apar ? $inspection->apar->serial_number : '-',
            $inspection->apar ? $inspection->apar->location_name : '-',
            $inspection->apar ? strtoupper($inspection->apar->type) : '-',
            $inspection->apar ? $inspection->apar->capacity . ' kg' : '-',
            $inspection->apar ? ucfirst($inspection->apar->status) : '-',
            $inspection->user ? $inspection->user->name : '-',
            $inspection->condition ?? '-',
            $inspection->notes ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Laporan Inspeksi';
    }

    public function styles(Worksheet $sheet)
    {
        // Header styling
        $sheet->getStyle('A1:K1')->applyFromArray([
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
        foreach (range('A', 'K') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Add title and period info
        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:K1');
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

        $sheet->mergeCells('A2:K2');
        $sheet->setCellValue('A2', 'Periode: ' . $this->data['period']);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => [
                'size' => 12,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A3:K3');
        $sheet->setCellValue('A3', 'Total Inspeksi: ' . $this->data['total_inspections'] . ' | Dibuat pada: ' . $this->data['generated_at']);
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
        $sheet->getStyle('A4:K4')->applyFromArray([
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
}
