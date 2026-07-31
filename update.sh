#!/bin/bash
git pull
docker compose build
docker compose up -d
echo "Update complete"
