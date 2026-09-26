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

class AuditLogExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['audit_logs'] ?? collect();
    }

    public function headings(): array
    {
        return [
            'No',
            'Waktu & Tanggal',
            'Nama Petugas / Teknisi',
            'No. Seri APAR',
            'Aktivitas / Aksi',
            'IP Address',
            'Latitude',
            'Longitude',
            'Status Hasil',
            'Keterangan / Catatan',
            'Device Info',
        ];
    }

    public function map($log): array
    {
        static $rowNumber = 1;

        $actionLabel = match($log->action) {
            'scan_qr' => 'Scan QR Code',
            'start_inspection' => 'Mulai Inspeksi',
            'submit_inspection' => 'Submit Inspeksi',
            'validation_failed' => 'Validasi Gagal (Anti-Fraud)',
            default => ucfirst(str_replace('_', ' ', (string) $log->action))
        };

        $deviceInfo = 'N/A';
        if (!empty($log->device_info)) {
            $deviceInfo = is_array($log->device_info) ? json_encode($log->device_info) : (string) $log->device_info;
        }

        return [
            $rowNumber++,
            $log->created_at ? Carbon::parse($log->created_at)->format('d/m/Y H:i:s') : '-',
            $log->user ? $log->user->name : 'Sistem / Anonim',
            $log->apar ? $log->apar->serial_number : 'N/A',
            $actionLabel,
            $log->ip_address ?? 'N/A',
            $log->lat ?? '-',
            $log->lng ?? '-',
            $log->is_successful ? 'Berhasil' : 'Gagal / Ditolak',
            $log->details ?? '-',
            $deviceInfo,
        ];
    }

    public function title(): string
    {
        return 'Audit Log Operasional';
    }

    public function styles(Worksheet $sheet)
    {
        foreach (range('A', 'K') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Insert 6 rows before row 1 for header & stats
        $sheet->insertNewRowBefore(1, 6);

        // Row 1: Org Header
        $sheet->mergeCells('A1:K1');
        $sheet->setCellValue('A1', 'PT PERTAMINA PATRA NIAGA - FUEL TERMINAL MAOS');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 2: Title
        $sheet->mergeCells('A2:K2');
        $sheet->setCellValue('A2', 'LAPORAN AUDIT LOG & JEJAK DIGITAL SISTEM CAKAP FT MAOS');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '041562']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 3: Period
        $sheet->mergeCells('A3:K3');
        $sheet->setCellValue('A3', 'Periode Audit: ' . $this->data['period'] . ' | Tanggal Unduh: ' . $this->data['generated_at']);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 4: Stats 1
        $sheet->mergeCells('A4:K4');
        $sheet->setCellValue('A4', 'Total Log: ' . ($this->data['stats']['total_logs'] ?? 0) . ' | Berhasil: ' . ($this->data['stats']['successful_logs'] ?? 0) . ' | Gagal: ' . ($this->data['stats']['failed_logs'] ?? 0));
        $sheet->getStyle('A4')->applyFromArray([
            'font' => ['size' => 10, 'bold' => true, 'color' => ['rgb' => '1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 5: Stats 2
        $sheet->mergeCells('A5:K5');
        $sheet->setCellValue('A5', 'Teknisi Aktif: ' . ($this->data['stats']['unique_users'] ?? 0) . ' | Tabung Terlibat: ' . ($this->data['stats']['unique_apars'] ?? 0));
        $sheet->getStyle('A5')->applyFromArray([
            'font' => ['size' => 9, 'bold' => true, 'color' => ['rgb' => '475569']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 6: Empty spacer
        $sheet->getRowDimension(6)->setRowHeight(10);

        // Row 7: Table Headings Styling
        $sheet->getStyle('A7:K7')->applyFromArray([
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
        $sheet->getRowDimension(7)->setRowHeight(25);

        // Data rows styling
        $highestRow = $sheet->getHighestRow();
        for ($r = 8; $r <= $highestRow; $r++) {
            $sheet->getStyle("A{$r}:B{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$r}:I{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$r}:K{$r}")->applyFromArray([
                'borders' => [
                    'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
            ]);
        }

        return $sheet;
    }
}