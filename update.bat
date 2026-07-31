@echo off
echo === UTM Link Builder Update ===
git pull
docker compose build
docker compose up -d
echo === Update Complete ===
