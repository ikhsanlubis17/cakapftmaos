<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class DamageReportExport implements WithMultipleSheets
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            new DamagedAparsSheet($this->data),
            new RepairHistorySheet($this->data),
        ];
    }
}

class DamagedAparsSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Daftar Tabung Rusak';
    }

    public function collection()
    {
        return $this->data['damaged_apars'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'No. Seri Tabung',
            'Lokasi / Penempatan',
            'Jenis Penempatan',
            'Jenis APAR',
            'Kapasitas',
            'Status Terkini',
            'Tekanan (Bar)',
            'Masa Berlaku',
            'Keterangan Masalah',
        ];
    }

    public function map($apar): array
    {
        static $row = 1;
        $type = $apar->aparType?->name ?? $apar->type ?? '-';
        $locationType = $apar->location_type === 'mobile' ? 'Mobile (Mobil Tangki)' : 'Statis (Gedung/Area)';

        return [
            $row++,
            $apar->serial_number,
            $apar->location_name ?? '-',
            $locationType,
            strtoupper((string) $type),
            $apar->capacity ? $apar->capacity . ' kg' : '-',
            getAparStatusLabel($apar->status),
            $apar->pressure ?? '-',
            $apar->expired_at ? Carbon::parse($apar->expired_at)->format('d/m/Y') : '-',
            $apar->notes ?? 'Memerlukan tindak lanjut pemeliharaan',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->insertNewRowBefore(1, 4);
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', 'PT PERTAMINA PATRA NIAGA - FUEL TERMINAL MAOS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'LAPORAN DAFTAR APAR RUSAK & PERLU PERBAIKAN');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'DA1212']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A3:J3');
        $sheet->setCellValue('A3', 'Total Tabung Bermasalah: ' . count($this->data['damaged_apars'] ?? []) . ' Unit | Waktu Unduh: ' . $this->data['generated_at']);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Table Header at Row 5
        $sheet->getStyle('A5:J5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'DA1212'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(5)->setRowHeight(25);

        $highestRow = $sheet->getHighestRow();
        for ($r = 6; $r <= $highestRow; $r++) {
            $sheet->getStyle("A{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$r}:I{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$r}:J{$r}")->applyFromArray([
                'borders' => [
                    'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
            ]);
        }

        return $sheet;
    }
}

class RepairHistorySheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Riwayat & Tiket Perbaikan';
    }

    public function collection()
    {
        return $this->data['repair_history'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'No. Tiket Perbaikan',
            'Tanggal Temuan',
            'No. Seri Tabung',
            'Lokasi Tabung',
            'Teknisi Pelaksana',
            'Supervisor Penyetuju',
            'Status Perbaikan',
            'Catatan Masalah / Instruksi',
            'Tanggal Selesai',
        ];
    }

    public function map($repair): array
    {
        static $row = 1;
        $apar = $repair->inspection?->apar;
        $statusLabel = match($repair->status) {
            'pending' => 'Menunggu Penugasan',
            'assigned' => 'Ditugaskan ke Teknisi',
            'in_progress' => 'Sedang Dikerjakan',
            'pending_review' => 'Menunggu Review Supervisor',
            'rework_required' => 'Perlu Perbaikan Ulang',
            'completed' => 'Selesai & Terverifikasi',
            'rejected' => 'Ditolak',
            default => ucfirst(str_replace('_', ' ', $repair->status ?? '-'))
        };

        return [
            $row++,
            'REP-' . str_pad($repair->id, 5, '0', STR_PAD_LEFT),
            $repair->created_at ? Carbon::parse($repair->created_at)->format('d/m/Y') : '-',
            $apar ? $apar->serial_number : '-',
            $apar ? $apar->location_name : '-',
            $repair->assignedTeknisi ? $repair->assignedTeknisi->name : '-',
            $repair->approver ? $repair->approver->name : '-',
            $statusLabel,
            $repair->supervisor_notes ?? $repair->admin_notes ?? $repair->repair_notes ?? '-',
            $repair->completed_at ? Carbon::parse($repair->completed_at)->format('d/m/Y H:i') : '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->insertNewRowBefore(1, 3);
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', 'RIWAYAT TIKET PERBAIKAN & VERIFIKASI SUPERVISOR');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Total Tiket Perbaikan: ' . count($this->data['repair_history'] ?? []) . ' | Waktu Unduh: ' . $this->data['generated_at']);
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
            $sheet->getStyle("A{$r}:C{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$r}:J{$r}")->applyFromArray([
                'borders' => [
                    'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
            ]);
        }

        return $sheet;
    }
}
