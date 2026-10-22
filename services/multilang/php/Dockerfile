FROM php:8.3-apache
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*
RUN a2enmod rewrite
COPY src/ /var/www/html/
COPY apache.conf /etc/apache2/conf-available/multilang-api.conf
RUN a2enconf multilang-api \
    && chown -R www-data:www-data /var/www/html
EXPOSE 80
