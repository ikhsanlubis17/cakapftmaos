#!/bin/sh
set -e

# Ensure Laravel storage directory structure and permissions
mkdir -p /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/app/public \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Ensure storage symlink exists
if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link --force || true
fi

# Run database migrations if AUTO_MIGRATE is true
if [ "${AUTO_MIGRATE}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
fi

# Warm up Laravel caches in production if CACHE_ON_STARTUP is true
if [ "${CACHE_ON_STARTUP}" = "true" ]; then
    echo "Optimizing Laravel configuration and routes..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Execute passed command (supervisord, queue:work, schedule:work, etc.)
exec "$@"
