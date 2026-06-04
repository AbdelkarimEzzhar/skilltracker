#!/usr/bin/env bash
# Install Let's Encrypt certificate on EC2 for skilltrack.dev (run after DNS points to Elastic IP).
set -euo pipefail

DOMAIN="${DOMAIN:-skilltrack.dev}"
EMAIL="${CERTBOT_EMAIL:-}"
PUBLIC_IP="${PUBLIC_IP:-51.21.63.138}"
EC2_HOST="${EC2_HOST:-${PUBLIC_IP}}"
INSTANCE_ID="${INSTANCE_ID:-i-00392517f1f4918f5}"
REGION="${AWS_REGION:-eu-north-1}"
SSH_KEY="${SSH_KEY:-/tmp/skilltrack-ec2-key}"

if [[ -z "${EMAIL}" ]]; then
  echo "Set CERTBOT_EMAIL=you@example.com for Let's Encrypt registration."
  exit 1
fi

echo "Checking DNS for ${DOMAIN}..."
RESOLVED="$(dig +short "${DOMAIN}" A | head -1)"
if [[ "${RESOLVED}" != "${PUBLIC_IP}" ]]; then
  echo "WARNING: ${DOMAIN} resolves to '${RESOLVED}', expected ${PUBLIC_IP}."
  echo "Fix DNS at name.com first (A record with blank host -> ${PUBLIC_IP}, remove parking/AAAA)."
  read -r -p "Continue anyway? [y/N] " ans
  [[ "${ans}" == [yY] ]] || exit 1
fi

aws ec2 authorize-security-group-ingress \
  --group-name skilltrack-web-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --region "${REGION}" 2>/dev/null || true

if [[ ! -f "${SSH_KEY}" ]]; then
  ssh-keygen -t ed25519 -f "${SSH_KEY}" -N "" -q
fi

aws ec2-instance-connect send-ssh-public-key \
  --instance-id "${INSTANCE_ID}" \
  --instance-os-user ec2-user \
  --ssh-public-key "file://${SSH_KEY}.pub" \
  --region "${REGION}" >/dev/null

ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "ec2-user@${EC2_HOST}" bash -s <<REMOTE
set -euo pipefail
sudo dnf install -y certbot
sudo certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN} \
  --non-interactive --agree-tos -m ${EMAIL} \
  --preferred-challenges http
REMOTE

echo "HTTPS certificate obtained. Run deploy/aws/configure-nginx-ssl.sh to wire nginx to port 443."
