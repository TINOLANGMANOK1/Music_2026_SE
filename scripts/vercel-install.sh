#!/usr/bin/env bash
set -euo pipefail

dnf install -y php8.4-cli php8.4-mbstring php8.4-xml

composer_setup=/tmp/composer-setup.php
expected_checksum="$(curl -fsSL https://composer.github.io/installer.sig)"
curl -fsSL https://getcomposer.org/installer -o "$composer_setup"
actual_checksum="$(php -r "echo hash_file('sha384', '$composer_setup');")"

if [[ "$expected_checksum" != "$actual_checksum" ]]; then
    echo "Composer installer checksum verification failed." >&2
    rm -f "$composer_setup"
    exit 1
fi

php "$composer_setup" --install-dir=/tmp --filename=composer
rm -f "$composer_setup"

export APP_ENV=testing
export COMPOSER_ALLOW_SUPERUSER=1
/tmp/composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
php artisan wayfinder:generate --with-form
unset APP_ENV
npm ci
