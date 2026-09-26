<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class AparExpiryAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Collection $expiringApars;
    public int $thresholdDays;
    public string $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Collection $expiringApars, int $thresholdDays = 30)
    {
        $this->expiringApars = $expiringApars;
        $this->thresholdDays = $thresholdDays;
        $this->actionUrl = url('/apar');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $count = $this->expiringApars->count();

        return new Envelope(
            subject: "[PERINGATAN ASET] {$count} APAR Mendekati / Melewati Masa Kedaluwarsa - CAKAP FT MAOS",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.apar.expiry-alert',
            with: [
                'expiringApars' => $this->expiringApars,
                'thresholdDays' => $this->thresholdDays,
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
