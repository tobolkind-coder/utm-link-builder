#!/bin/bash
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/init-ssl.sh <domain> <email>"
  exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "Requesting SSL for $DOMAIN..."

# Clean up old certbot directories to avoid conflicts
rm -rf ./certbot/conf/live/"$DOMAIN" ./certbot/conf/archive/"$DOMAIN" ./certbot/conf/renewal/"$DOMAIN".conf

# Request new certificate
if docker compose run --rm --entrypoint certbot certbot certonly --webroot --webroot-path=/var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive; then
  echo "SSL initialized successfully."
  docker compose restart nginx
else
  echo "Warning: SSL initialization failed. Falling back to self-signed certificate."
  bash scripts/init-self-signed.sh "$DOMAIN"
  docker compose restart nginx
  exit 1
fi
