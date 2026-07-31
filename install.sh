#!/bin/bash
set -e

echo "=== UTM Link Builder Installer ==="
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./install.sh)"
  exit 1
fi

# Function to drain stdin
drain_stdin() {
  while read -r -t 0.1 -n 4096 _junk < /dev/tty 2>/dev/null; do :; done
}

# Install Docker
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
  echo "Installing Docker Compose plugin..."
  apt-get update
  apt-get install -y docker-compose-plugin
fi

# Get settings
while true; do
  drain_stdin
  read -p "Domain (default: go.company.ru): " DOMAIN
  DOMAIN=${DOMAIN:-go.company.ru}
  # Sanitize: remove all except alphanumeric, dots, and hyphens
  DOMAIN=$(printf '%s' "$DOMAIN" | tr -cd 'A-Za-z0-9.-')
  # Validate: simple regex for domain
  if [[ "$DOMAIN" =~ ^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$ ]]; then
    break
  else
    echo "Invalid domain format. Please try again."
  fi
done

while true; do
  drain_stdin
  read -p "Email for SSL (optional): " LETSENCRYPT_EMAIL
  # Sanitize email: remove non-ASCII/control
  LETSENCRYPT_EMAIL=$(printf '%s' "$LETSENCRYPT_EMAIL" | tr -cd '[:print:]')
  break
done

echo "Domain configured: $DOMAIN"
if [ ! -z "$LETSENCRYPT_EMAIL" ]; then
  echo "Email configured: $LETSENCRYPT_EMAIL"
fi

# Generate secrets
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
AUTH_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# Create .env
cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=utm_builder
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/utm_builder?schema=public
AUTH_SECRET=${AUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}
SHORT_DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
POSTGRES_PORT=5432
WEB_PORT=3000
NODE_ENV=production
EOF

echo ""
echo "Building and starting..."
bash scripts/init-self-signed.sh "$DOMAIN"
docker compose up -d --build

echo "Waiting for database initialization..."
LOGIN_PATH=""
for i in {1..30}; do
  sleep 2
  LOGIN_PATH=$(docker compose exec -T db psql -U postgres -d utm_builder -t -c 'SELECT "customLoginPath" FROM "Settings" LIMIT 1' | tr -d '[:space:]')
  if [ ! -z "$LOGIN_PATH" ]; then break; fi
done

if [ ! -z "$LETSENCRYPT_EMAIL" ]; then
  echo "Initializing SSL..."
  bash scripts/init-ssl.sh "$DOMAIN" "$LETSENCRYPT_EMAIL" || echo "Warning: SSL initialization failed. Check logs."
fi

echo ""
echo "=== Installation Complete ==="
echo "Note: The root domain (https://${DOMAIN}) returns 404 for security."
echo "Login URL: https://${DOMAIN}/${LOGIN_PATH:-auth-unknown}"
echo "Login: admin"
echo "Password: admin123"
echo ""
echo "You can change the login path in Admin > Settings."
