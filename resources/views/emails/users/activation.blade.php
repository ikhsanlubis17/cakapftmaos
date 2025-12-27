<x-mail::message>
# Halo, {{ $user->name }}!

Admin telah mendaftarkan akun Anda di sistem CAKAP FT Maos.
Untuk dapat menggunakan akun ini, silakan lakukan aktivasi dengan menekan tombol di bawah ini.

<x-mail::button :url="$url">
Aktivasi Akun
</x-mail::button>

Jika Anda tidak merasa mendaftar atau didaftarkan, silakan abaikan email ini.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
