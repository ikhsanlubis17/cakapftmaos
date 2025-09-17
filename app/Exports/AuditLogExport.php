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

class AuditLogExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['audit_logs'];
    }

    public function headings(): array
    {
        return [
            'No',
            'Waktu',
            'Teknisi',
            'APAR',
            'Aksi',
            'IP Address',
            'Latitude',
            'Longitude',
            'Status',
            'Detail',
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
            'validation_failed' => 'Validasi Gagal',
            default => ucfirst(str_replace('_', ' ', $log->action))
        };

        $deviceInfo = $log->device_info ? json_encode($log->device_info) : 'N/A';
        
        return [
            $rowNumber++,
            $log->created_at ? Carbon::parse($log->created_at)->format('d/m/Y H:i:s') : '-',
            $log->user ? $log->user->name : 'N/A',
            $log->apar ? $log->apar->serial_number : 'N/A',
            $actionLabel,
            $log->ip_address ?? 'N/A',
            $log->lat ?? 'N/A',
            $log->lng ?? 'N/A',
            $log->is_successful ? 'Berhasil' : 'Gagal',
            $log->details ?? '-',
            $deviceInfo,
        ];
    }

    public function title(): string
    {
        return 'Audit Log';
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
        $sheet->insertNewRowBefore(1, 6);
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

        // Stats row
        $sheet->mergeCells('A3:K3');
        $sheet->setCellValue('A3', 'Total Logs: ' . $this->data['stats']['total_logs'] . ' | Berhasil: ' . $this->data['stats']['successful_logs'] . ' | Gagal: ' . $this->data['stats']['failed_logs']);
        $sheet->getStyle('A3')->applyFromArray([
            'font' => [
                'size' => 10,
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A4:K4');
        $sheet->setCellValue('A4', 'Teknisi Aktif: ' . $this->data['stats']['unique_users'] . ' | APAR Terlibat: ' . $this->data['stats']['unique_apars']);
        $sheet->getStyle('A4')->applyFromArray([
            'font' => [
                'size' => 10,
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Actions breakdown
        $actionsText = 'Breakdown Aksi: ';
        foreach ($this->data['stats']['actions_breakdown'] as $action => $count) {
            $actionsText .= ucfirst(str_replace('_', ' ', $action)) . ': ' . $count . ' | ';
        }
        $sheet->mergeCells('A5:K5');
        $sheet->setCellValue('A5', rtrim($actionsText, ' | '));
        $sheet->getStyle('A5')->applyFromArray([
            'font' => [
                'size' => 10,
                'italic' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->mergeCells('A6:K6');
        $sheet->setCellValue('A6', 'Dibuat pada: ' . $this->data['generated_at']);
        $sheet->getStyle('A6')->applyFromArray([
            'font' => [
                'size' => 10,
                'italic' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Adjust header row position
        $sheet->getStyle('A7:K7')->applyFromArray([
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