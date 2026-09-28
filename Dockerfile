# ==============================================================================
# Multi-Stage Production Dockerfile for CAKAP FT MAOS
# PT Pertamina Patra Niaga - Fuel Terminal Maos
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Frontend Asset Compilation (Node 22 Alpine)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Install dependencies with clean cache
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source files and compile production bundle
COPY vite.config.js tsconfig.json ./
COPY resources ./resources
COPY public ./public
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: PHP Vendor Dependencies (Composer 2)
# ------------------------------------------------------------------------------
FROM composer:2 AS composer-builder
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs

# ------------------------------------------------------------------------------
# STAGE 3: Final Production Runtime (PHP 8.4-FPM + Nginx + Supervisor on Alpine)
# ------------------------------------------------------------------------------
FROM php:8.4-fpm-alpine AS production

LABEL maintainer="PT Pertamina Patra Niaga - FT Maos" \
      description="Sistem Monitoring dan Inspeksi APAR Modern (CAKAP FT MAOS)" \
      version="1.0.0"

# Install production OS packages and PHP build libraries
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    freetype \
    libjpeg-turbo \
    libpng \
    libzip \
    icu-libs \
    sqlite-libs \
    oniguruma

# Build and configure PHP extensions (Intervention Image, MySQL, SQLite, Redis, Opcache)
RUN apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        freetype-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        libzip-dev \
        icu-dev \
        sqlite-dev \
        oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        pdo_mysql \
        pdo_sqlite \
        zip \
        intl \
        opcache \
        bcmath \
        pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -rf /tmp/pear

# Set working directory
WORKDIR /var/www/html

# Copy server and runtime configurations
COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy application source code
COPY --chown=www-data:www-data . .

# Copy production PHP vendor from Stage 2
COPY --chown=www-data:www-data --from=composer-builder /app/vendor ./vendor

# Copy compiled frontend assets from Stage 1
COPY --chown=www-data:www-data --from=frontend-builder /app/public/build ./public/build

# Finalize Composer classmap optimization
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev \
    && rm /usr/bin/composer

# Prepare storage directories and file permissions
RUN mkdir -p storage/framework/sessions \
             storage/framework/views \
             storage/framework/cache \
             storage/app/public \
             storage/logs \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Expose HTTP port
EXPOSE 80

# Health check using Laravel 12 native /up endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1/up || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
