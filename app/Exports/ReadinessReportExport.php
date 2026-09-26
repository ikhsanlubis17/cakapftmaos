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

class ReadinessReportExport implements WithMultipleSheets
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            new ReadinessAnalysisSheet($this->data),
            new OverdueSchedulesSheet($this->data),
        ];
    }
}

class ReadinessAnalysisSheet implements FromArray, WithHeadings, WithStyles, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Analisis Kesiapan FT Maos';
    }

    public function headings(): array
    {
        return ['Indikator Kesiapan Proteksi Kebakaran', 'Nilai / Realisasi', 'Target / Standar HSSE', 'Status Kepatuhan'];
    }

    public function array(): array
    {
        $stats = $this->data['stats'];
        $complianceIndex = $this->data['readiness_index'] ?? 0;

        $rows = [
            ['INDIKATOR KESIAPAN PROTEKSI KEBAKARAN', '', '', ''],
            ['Indeks Kesiapan Proteksi Kebakaran', $complianceIndex . '%', 'Min. 95.0%', $complianceIndex >= 95 ? 'MEMENUHI STANDAR' : 'PERLU ATENSI'],
            ['Populasi Total APAR FT Maos', $stats['total_apar'], 'Unit Terdaftar', '100% Terverifikasi'],
            ['APAR Kondisi Siaga Operasi (Ready)', $stats['ready_apar'], 'Unit', 'Siap Digunakan'],
            ['APAR Bermasalah / Butuh Tindakan', $stats['unready_apar'], '0 Unit (Target)', $stats['unready_apar'] == 0 ? 'MEMENUHI' : 'TERDAPAT TEMUAN'],
            ['Tingkat Kesiapan Armada Mobil Tangki', $stats['tank_trucks_ready'] . ' / ' . $stats['total_tank_trucks'], 'Unit Armada', '100% Siaga'],
            ['Jadwal Inspeksi Terlambat (Overdue)', $stats['overdue_schedules_count'], '0 Jadwal (Target)', $stats['overdue_schedules_count'] == 0 ? 'DISIPLIN TEPAT WAKTU' : 'TERLAMBAT'],
            ['', '', '', ''],

            ['ANALISIS KESIAPAN PER ZONA STRATEGIS OBJEK VITAL', '', '', ''],
        ];

        if (!empty($this->data['zone_distribution'])) {
            foreach ($this->data['zone_distribution'] as $zone) {
                $pct = $zone['total'] > 0 ? round(($zone['ready'] / $zone['total']) * 100, 1) : 0;
                $status = $pct >= 95 ? 'SIAGA TINGGI' : ($pct >= 80 ? 'SIAGA SEDANG' : 'PERHATIAN KHUSUS');
                $rows[] = [
                    'Zona: ' . $zone['name'],
                    $zone['ready'] . ' Siap dari ' . $zone['total'] . ' Unit (' . $pct . '%)',
                    'Min. 95% Siap',
                    $status
                ];
            }
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->insertNewRowBefore(1, 4);
        $sheet->mergeCells('A1:D1');
        $sheet->setCellValue('A1', 'PT PERTAMINA PATRA NIAGA - FUEL TERMINAL MAOS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A2:D2');
        $sheet->setCellValue('A2', 'LAPORAN ANALISIS KESIAPAN PROTEKSI KEBAKARAN OBJEK VITAL NASIONAL');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '059669']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A3:D3');
        $sheet->setCellValue('A3', 'Periode Analisis: ' . $this->data['period'] . ' | Waktu Unduh: ' . $this->data['generated_at']);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Table Header at Row 5
        $sheet->getStyle('A5:D5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '059669'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(5)->setRowHeight(25);

        $highestRow = $sheet->getHighestRow();
        for ($row = 6; $row <= $highestRow; $row++) {
            $cellA = $sheet->getCell("A{$row}")->getValue();
            $cellB = $sheet->getCell("B{$row}")->getValue();

            if (!empty($cellA) && $cellB === '') {
                $sheet->mergeCells("A{$row}:D{$row}");
                $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => '041562'], 'size' => 10],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E2E8F0'],
                    ],
                ]);
            } elseif (!empty($cellA)) {
                $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                    'borders' => [
                        'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                    ],
                ]);
                $sheet->getStyle("B{$row}:D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
        }

        return $sheet;
    }
}

class OverdueSchedulesSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Jadwal Inspeksi Terlambat';
    }

    public function collection()
    {
        return $this->data['overdue_schedules'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'No. Seri APAR',
            'Lokasi / Penempatan',
            'Jenis APAR',
            'Batas Waktu Jadwal',
            'Keterlambatan',
            'Teknisi Ditugaskan',
            'Frekuensi',
            'Prioritas',
            'Status / Catatan',
        ];
    }

    public function map($schedule): array
    {
        static $row = 1;
        $apar = $schedule->apar;
        $type = $apar?->aparType?->name ?? $apar?->type ?? '-';
        $startAt = $schedule->start_at ? Carbon::parse($schedule->start_at) : null;
        $daysOverdue = $startAt ? (int) $startAt->diffInDays(now()) : 0;

        return [
            $row++,
            $apar ? $apar->serial_number : '-',
            $apar ? $apar->location_name : '-',
            strtoupper((string) $type),
            $startAt ? $startAt->format('d/m/Y H:i') : '-',
            $daysOverdue . ' Hari Terlambat',
            $schedule->assignedUser ? $schedule->assignedUser->name : 'Belum Ditugaskan',
            getFrequencyLabel($schedule->frequency ?? 'monthly'),
            strtoupper($schedule->priority ?? 'NORMAL'),
            $schedule->notes ?? 'Segera laksanakan inspeksi lapangan',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', 'PENGAWASAN JADWAL INSPEKSI TERLAMBAT (OVERDUE) FT MAOS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'DA1212']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Total Terlambat: ' . count($this->data['overdue_schedules'] ?? []) . ' Jadwal | Waktu Unduh: ' . $this->data['generated_at']);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Table Header at Row 4
        $sheet->getStyle('A4:J4')->applyFromArray([
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
            $sheet->getStyle("A{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E{$r}:I{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$r}:J{$r}")->applyFromArray([
                'borders' => [
                    'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
            ]);
        }

        return $sheet;
    }
}
