<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class DailyShiftReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $technician;
    public Collection $schedules;
    public string $actionUrl;
    public string $dateString;

    /**
     * Create a new message instance.
     */
    public function __construct(User $technician, Collection $schedules)
    {
        $this->technician = $technician;
        $this->schedules = $schedules;
        $this->actionUrl = url('/scan');
        $this->dateString = now('Asia/Jakarta')->locale('id')->isoFormat('dddd, D MMMM Y');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[PENGINGAT SHIFT] Jadwal Inspeksi APAR Hari Ini - CAKAP FT MAOS",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.schedules.daily-reminder',
            with: [
                'technician' => $this->technician,
                'schedules' => $this->schedules,
                'dateString' => $this->dateString,
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
