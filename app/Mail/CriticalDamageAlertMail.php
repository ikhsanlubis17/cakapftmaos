<?php

namespace App\Mail;

use App\Models\Inspection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CriticalDamageAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Inspection $inspection;
    public string $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Inspection $inspection)
    {
        $this->inspection = $inspection->loadMissing([
            'apar.aparType',
            'user',
            'inspectionDamages.damageCategory',
        ]);
        $this->actionUrl = url('/repairs/review/' . $this->inspection->id);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $apar = $this->inspection->apar;
        $serial = $apar ? $apar->serial_number : 'APAR';
        $location = $apar ? $apar->location_name : 'Lokasi Tidak Diketahui';

        return new Envelope(
            subject: "[PERINGATAN HSSE] Temuan APAR Rusak - {$serial} ({$location})",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.inspections.critical-damage',
            with: [
                'inspection' => $this->inspection,
                'apar' => $this->inspection->apar,
                'inspector' => $this->inspection->user,
                'damages' => $this->inspection->inspectionDamages,
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
