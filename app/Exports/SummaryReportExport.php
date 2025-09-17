<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;

class SummaryReportExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        $stats = $this->data['stats'];
        
        $rows = [
            ['Kategori', 'Jumlah', 'Keterangan'],
            ['Total APAR', $stats['total_apar'], 'Semua APAR dalam sistem'],
            ['APAR Aktif', $stats['active_apar'], 'APAR dalam kondisi baik'],
            ['Perlu Refill', $stats['needs_refill'], 'APAR yang perlu diisi ulang'],
            ['Kadaluarsa', $stats['expired'], 'APAR yang sudah kadaluarsa'],
            ['Rusak', $stats['damaged'], 'APAR yang rusak'],
            ['', '', ''],
            ['Inspeksi Periode Ini', $stats['inspections_this_period'], 'Jumlah inspeksi dalam periode'],
            ['', '', ''],
            ['Jenis Lokasi', '', ''],
            ['- Statis', $stats['location_types']['statis'], 'APAR di lokasi tetap'],
            ['- Mobil', $stats['location_types']['mobile'], 'APAR di kendaraan'],
            ['', '', ''],
            ['Jenis APAR', '', ''],
        ];

        // Add dynamic APAR types
        if (!empty($stats['apar_types'])) {
            foreach ($stats['apar_types'] as $typeName => $count) {
                $rows[] = ['- ' . ucfirst($typeName), $count, 'APAR ' . strtolower($typeName)];
            }
        } else {
            $rows[] = ['- Tidak ada data', 0, 'Tidak ada jenis APAR terdaftar'];
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'Kategori',
            'Jumlah',
            'Keterangan',
        ];
    }

    public function title(): string
    {
        return 'Laporan Ringkasan';
    }

    public function styles(Worksheet $sheet)
    {
        // Auto-size columns
        foreach (range('A', 'C') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Add title and period info
        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:C1');
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

        $sheet->mergeCells('A2:C2');
        $sheet->setCellValue('A2', 'Periode: ' . $this->data['period']);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => [
                'size' => 12,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A3:C3');
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

        // Header styling
        $sheet->getStyle('A4:C4')->applyFromArray([
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

        // Style category headers
        $sheet->getStyle('A11:A11')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 12,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F3F4F6'],
            ],
        ]);

        $sheet->getStyle('A15:A15')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 12,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F3F4F6'],
            ],
        ]);

        return $sheet;
    }
}
