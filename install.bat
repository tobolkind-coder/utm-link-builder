@echo off
echo === UTM Link Builder Installer (Windows) ===
echo.
echo This installer requires Docker Desktop to be running.
echo If Docker Desktop is not installed, download it from:
echo https://www.docker.com/products/docker-desktop/
echo.

set /p DOMAIN="Domain (default: go.company.ru): "
if "%DOMAIN%"=="" set DOMAIN=go.company.ru

echo.
echo Generating random secrets...
for /f %%a in ('powershell -Command "[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()"') do set POSTGRES_PASSWORD=%%a
for /f %%a in ('powershell -Command "[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()"') do set AUTH_SECRET=%%a

echo.
echo Creating .env file...
(
echo POSTGRES_USER=postgres
echo POSTGRES_PASSWORD=%POSTGRES_PASSWORD%
echo POSTGRES_DB=utm_builder
echo DATABASE_URL=postgresql://postgres:%POSTGRES_PASSWORD%@db:5432/utm_builder?schema=public
echo AUTH_SECRET=%AUTH_SECRET%
echo NEXTAUTH_URL=https://%DOMAIN%
echo SHORT_DOMAIN=%DOMAIN%
echo POSTGRES_PORT=5432
echo WEB_PORT=3000
echo NODE_ENV=production
) > .env

echo.
echo Building and starting...
docker compose up -d --build

echo.
echo Note: Automatic SSL initialization is not supported on Windows.
echo Configure reverse proxy (Nginx) manually for HTTPS.
echo.
echo === Installation Complete ===
echo URL: https://%DOMAIN%
echo Login: admin
echo Password: admin123
echo.
echo Default data will be imported on first login.
pause
