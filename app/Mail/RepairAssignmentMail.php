<?php

namespace App\Mail;

use App\Models\RepairApproval;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RepairAssignmentMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public RepairApproval $repairApproval;
    public string $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(RepairApproval $repairApproval)
    {
        $this->repairApproval = $repairApproval->loadMissing([
            'inspection.apar.aparType',
            'assignedUser',
            'approver',
        ]);
        $this->actionUrl = url('/repairs/' . $this->repairApproval->id . '/report');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $apar = $this->repairApproval->inspection?->apar;
        $serial = $apar ? $apar->serial_number : 'APAR';

        return new Envelope(
            subject: "[PENUGASAN PERBAIKAN] APAR {$serial} - CAKAP FT MAOS",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $apar = $this->repairApproval->inspection?->apar;
        $technician = $this->repairApproval->assignedUser;
        $approver = $this->repairApproval->approver;

        return new Content(
            view: 'emails.repairs.assignment',
            with: [
                'repairApproval' => $this->repairApproval,
                'apar' => $apar,
                'technician' => $technician,
                'approver' => $approver,
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
