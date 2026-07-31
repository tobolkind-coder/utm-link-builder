#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./scripts/init-self-signed.sh <domain>"
  exit 1
fi

DOMAIN=$1
CERT_DIR="./certbot/conf/live/$DOMAIN"

if [ ! -d "$CERT_DIR" ]; then
  echo "Generating self-signed certificate for $DOMAIN..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=$DOMAIN"
  chmod 600 "$CERT_DIR/privkey.pem"
fi
