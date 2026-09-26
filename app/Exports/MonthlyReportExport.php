<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class MonthlyReportExport implements WithMultipleSheets
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            new MonthlySummarySheet($this->data),
            new MonthlyInspectionsSheet($this->data),
        ];
    }
}

class MonthlySummarySheet implements FromArray, WithHeadings, WithStyles, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Ringkasan Kesiapan';
    }

    public function headings(): array
    {
        return ['Parameter', 'Jumlah', 'Satuan / Persentase', 'Keterangan Operasional'];
    }

    public function array(): array
    {
        $stats = $this->data['stats'];
        $readinessPct = $stats['total_apar'] > 0 
            ? round(($stats['active_apar'] / $stats['total_apar']) * 100, 1) 
            : 0;

        $rows = [
            // Section 1: Kesiapan APAR
            ['KESIAPAN APAR', '', '', ''],
            ['Total Populasi APAR', $stats['total_apar'], 'Unit', 'Seluruh unit APAR terdaftar di FT Maos'],
            ['APAR Siap Operasi (Aktif)', $stats['active_apar'], $readinessPct . '%', 'Kondisi prima siap digunakan'],
            ['APAR Perlu Perbaikan', $stats['needs_repair'], 'Unit', 'Temuan inspeksi memerlukan perbaikan teknisi'],
            ['APAR Sedang Diperbaiki', $stats['under_repair'], 'Unit', 'Dalam pengerjaan perbaikan'],
            ['APAR Rusak / Afkir', $stats['not_fixable'], 'Unit', 'Tabung tidak dapat diperbaiki / usang'],
            ['APAR Non-Aktif', $stats['inactive'], 'Unit', 'Tidak terpasang di lapangan'],
            ['', '', '', ''],

            // Section 2: Kesiapan Mobil Tangki
            ['KESIAPAN MOBIL TANGKI (FLEET)', '', '', ''],
            ['Total Mobil Tangki', $stats['total_tank_trucks'] ?? 0, 'Unit', 'Armada mobil tangki terdaftar'],
            ['Mobil Tangki Aktif / Siaga', $stats['active_tank_trucks'] ?? 0, 'Unit', 'Memiliki APAR terverifikasi siap operasi'],
            ['', '', '', ''],

            // Section 3: Distribusi Lokasi APAR
            ['DISTRIBUSI PENEMPATAN LOKASI', '', '', ''],
            ['APAR Statis (Gedung, Area Kilang, Pompa)', $stats['location_types']['statis'] ?? 0, 'Unit', 'Penempatan tetap di fasilitas'],
            ['APAR Mobile (Mobil Tangki & Bergerak)', $stats['location_types']['mobile'] ?? 0, 'Unit', 'Terpasang pada armada bergerak'],
            ['', '', '', ''],

            // Section 4: Kinerja Inspeksi Periode Ini
            ['KINERJA INSPEKSI PERIODE INI', '', '', ''],
            ['Total Inspeksi Terlaksana', $stats['inspections_this_period'] ?? 0, 'Kali', 'Inspeksi fisik tabung oleh teknisi'],
            ['Inspeksi Kondisi Baik', $stats['inspections_good'] ?? 0, 'Kali', 'Hasil cek seluruh komponen lolos uji'],
            ['Inspeksi Temuan Rusak', $stats['inspections_damaged'] ?? 0, 'Kali', 'Diteruskan ke alur persetujuan perbaikan'],
            ['', '', '', ''],

            // Section 5: Distribusi Tipe Media
            ['DISTRIBUSI MEDIA PEMADAM', '', '', ''],
        ];

        if (!empty($stats['apar_types'])) {
            foreach ($stats['apar_types'] as $typeName => $count) {
                $rows[] = ['Media: ' . ucfirst($typeName), $count, 'Unit', 'APAR jenis ' . strtolower($typeName)];
            }
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        // Auto-fit columns
        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Title rows insertion
        $sheet->insertNewRowBefore(1, 4);
        $sheet->mergeCells('A1:D1');
        $sheet->setCellValue('A1', 'PT PERTAMINA PATRA NIAGA - FUEL TERMINAL MAOS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A2:D2');
        $sheet->setCellValue('A2', 'LAPORAN BULANAN KESIAPAN OPERASIONAL APAR & MOBIL TANGKI');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A3:D3');
        $sheet->setCellValue('A3', 'Periode: ' . $this->data['period'] . ' | Tanggal Unduh: ' . $this->data['generated_at']);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Table Header Styling at Row 5
        $sheet->getStyle('A5:D5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '041562'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(5)->setRowHeight(25);

        // Style the section header rows
        $highestRow = $sheet->getHighestRow();
        for ($row = 6; $row <= $highestRow; $row++) {
            $cellA = $sheet->getCell("A{$row}")->getValue();
            $cellB = $sheet->getCell("B{$row}")->getValue();

            if (!empty($cellA) && $cellB === '') {
                // Section header
                $sheet->mergeCells("A{$row}:D{$row}");
                $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => '041562'], 'size' => 10],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E2E8F0'],
                    ],
                ]);
            } elseif (!empty($cellA)) {
                // Regular data row
                $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                    'borders' => [
                        'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                    ],
                ]);
                $sheet->getStyle("B{$row}:C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
        }

        return $sheet;
    }
}

class MonthlyInspectionsSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Data Inspeksi Periode';
    }

    public function collection()
    {
        return $this->data['inspections'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Waktu',
            'No. Seri Tabung',
            'Lokasi / Unit',
            'Jenis APAR',
            'Kapasitas',
            'Status Tabung',
            'Teknisi',
            'Hasil Inspeksi',
            'Catatan Temuan',
        ];
    }

    public function map($inspection): array
    {
        static $row = 1;
        $apar = $inspection->apar;
        $type = $apar?->aparType?->name ?? $apar?->type ?? '-';
        $status = $apar ? getAparStatusLabel($apar->status) : '-';

        return [
            $row++,
            $inspection->created_at ? Carbon::parse($inspection->created_at)->format('d/m/Y') : '-',
            $inspection->created_at ? Carbon::parse($inspection->created_at)->format('H:i') : '-',
            $apar ? $apar->serial_number : '-',
            $apar ? $apar->location_name : '-',
            strtoupper((string) $type),
            $apar ? ($apar->capacity ? $apar->capacity . ' kg' : '-') : '-',
            $status,
            $inspection->user ? $inspection->user->name : '-',
            $inspection->condition === 'good' ? 'Baik (Siap Pakai)' : 'Rusak / Temuan',
            $inspection->notes ?? '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:K1');
        $sheet->setCellValue('A1', 'DAFTAR DETAIL INSPEKSI FISIK APAR PERIODE ' . $this->data['period']);
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A2:K2');
        $sheet->setCellValue('A2', 'Total Inspeksi: ' . count($this->data['inspections'] ?? []) . ' | Waktu Unduh: ' . $this->data['generated_at']);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Table Header at Row 4
        $sheet->getStyle('A4:K4')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
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
