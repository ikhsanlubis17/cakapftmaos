<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public string $token;
    public string $email;
    public string $name;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $token, string $email, string $name)
    {
        $this->token = $token;
        $this->email = $email;
        $this->name = $name;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $appName = config('app.name', 'CAKAP FT MAOS');
        $appUrl  = config('app.url', 'http://localhost');

        $resetUrl = rtrim($appUrl, '/') . '/reset-password'
            . '?token=' . urlencode($this->token)
            . '&email=' . urlencode($this->email);

        return (new MailMessage)
            ->subject("Pemulihan Kata Sandi — {$appName}")
            ->greeting("Halo, {$this->name}!")
            ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.')
            ->line('Klik tombol di bawah untuk membuat kata sandi baru. Link ini akan kedaluwarsa dalam **60 menit**.')
            ->action('Atur Ulang Kata Sandi', $resetUrl)
            ->line('Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini — akun Anda tetap aman.')
            ->salutation("— Tim {$appName}");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
