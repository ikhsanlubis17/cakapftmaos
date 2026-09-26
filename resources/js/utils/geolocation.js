/**
 * Shared geolocation helper for browser GPS coordinates.
 */
export const fetchCurrentCoordinates = (options = {}) => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation tidak didukung oleh browser Anda.'));
        }

        const config = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
            ...options
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            (err) => {
                let msg = 'Terjadi kesalahan saat mendapatkan lokasi.';
                if (err.code === 1) msg = 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser.';
                else if (err.code === 2) msg = 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
                else if (err.code === 3) msg = 'Waktu tunggu untuk mendapatkan lokasi habis.';
                reject(new Error(msg));
            },
            config
        );
    });
};

/**
 * Calculate distance in meters between two lat/lng coordinates (Haversine formula).
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
