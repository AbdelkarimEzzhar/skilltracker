#!/bin/bash
set -euxo pipefail

REGION="__REGION__"
BUCKET="__BUCKET__"
ARCHIVE_KEY="__ARCHIVE_KEY__"
APP_URL="__APP_URL__"
JWT_SECRET="__JWT_SECRET__"
MONGO_URI="__MONGO_URI__"
GROQ_API_KEY="__GROQ_API_KEY__"

dnf update -y
dnf install -y docker awscli
systemctl enable --now docker

COMPOSE_VERSION="v2.27.1"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version

if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

mkdir -p /opt/skilltrack
aws s3 cp "s3://${BUCKET}/${ARCHIVE_KEY}" /tmp/skilltrack-deploy.tar.gz --region "${REGION}"
tar -xzf /tmp/skilltrack-deploy.tar.gz -C /opt/skilltrack

cat >/opt/skilltrack/deploy/aws/.env <<EOF
JWT_SECRET=${JWT_SECRET}
MONGO_URI=${MONGO_URI}
CORS_ORIGIN=__CORS_ORIGIN__
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
GROQ_API_KEY=${GROQ_API_KEY}
EOF

cd /opt/skilltrack/deploy/aws
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
