#!/bin/sh

# Run from your computer; "nas" must be configured as an SSH host.

set -eu

ssh nas '\
set -eu
cd /volume1/docker/audiobookshelf
git fetch origin port-notification-on-download
git checkout port-notification-on-download
git pull --ff-only origin port-notification-on-download
docker compose -f docker-compose.nas.yml up -d --build
docker compose -f docker-compose.nas.yml ps
'
