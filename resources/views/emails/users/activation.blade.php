<x-mail::message>
# Halo, {{ $user->name }}!

Admin telah mendaftarkan akun Anda di sistem {{ setting('site_name', config('app.name', 'CAKAP FT MAOS')) }}.
Untuk dapat menggunakan akun ini, silakan lakukan aktivasi dengan menekan tombol di bawah ini.

<x-mail::button :url="$url">
Aktivasi Akun
</x-mail::button>

Jika Anda tidak merasa mendaftar atau didaftarkan, silakan abaikan email ini.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
