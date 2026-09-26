<?php

namespace App\Mail;

use App\Models\RepairReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RepairCompletedReviewMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public RepairReport $repairReport;
    public string $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(RepairReport $repairReport)
    {
        $this->repairReport = $repairReport->loadMissing([
            'repairApproval.inspection.apar.aparType',
            'user',
        ]);
        $this->actionUrl = url('/repairs/review/' . $this->repairReport->id);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $apar = $this->repairReport->repairApproval?->inspection?->apar;
        $serial = $apar ? $apar->serial_number : 'APAR';

        return new Envelope(
            subject: "[REVIEW PERBAIKAN] Laporan Perbaikan APAR {$serial} - CAKAP FT MAOS",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $apar = $this->repairReport->repairApproval?->inspection?->apar;
        $technician = $this->repairReport->user;

        return new Content(
            view: 'emails.repairs.completed-review',
            with: [
                'repairReport' => $this->repairReport,
                'apar' => $apar,
                'technician' => $technician,
                'actionUrl' => $this->actionUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
