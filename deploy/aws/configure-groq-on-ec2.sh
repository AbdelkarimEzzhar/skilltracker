#!/usr/bin/env bash
# Push GROQ_* settings from local skilltrack-backend/.env to EC2 (does not print the key).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/skilltrack-backend/.env"
EC2_HOST="${EC2_HOST:-51.21.63.138}"
INSTANCE_ID="${INSTANCE_ID:-i-00392517f1f4918f5}"
REGION="${AWS_REGION:-eu-north-1}"
SSH_KEY="${SSH_KEY:-/tmp/skilltrack-ec2-key}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${GROQ_API_KEY:-}" || "${GROQ_API_KEY}" == your_groq_api_key_here ]]; then
  echo "Set a real GROQ_API_KEY in skilltrack-backend/.env first."
  exit 1
fi

GROQ_BASE_URL="${GROQ_BASE_URL:-https://api.groq.com/openai/v1}"
GROQ_MODEL="${GROQ_MODEL:-llama-3.1-8b-instant}"
AI_PROVIDER="${AI_PROVIDER:-groq}"

if [[ ! -f "${SSH_KEY}" ]]; then
  ssh-keygen -t ed25519 -f "${SSH_KEY}" -N "" -q
fi

aws ec2-instance-connect send-ssh-public-key \
  --instance-id "${INSTANCE_ID}" \
  --instance-os-user ec2-user \
  --ssh-public-key "file://${SSH_KEY}.pub" \
  --region "${REGION}" >/dev/null

REMOTE_ENV="/opt/skilltrack/deploy/aws/.env"
TMP="$(mktemp)"
chmod 600 "${TMP}"
cat >"${TMP}" <<EOF
AI_PROVIDER=${AI_PROVIDER}
GROQ_API_KEY=${GROQ_API_KEY}
GROQ_BASE_URL=${GROQ_BASE_URL}
GROQ_MODEL=${GROQ_MODEL}
EOF

scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${TMP}" "ec2-user@${EC2_HOST}:/tmp/groq.env.fragment"
rm -f "${TMP}"

ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "ec2-user@${EC2_HOST}" bash -s <<REMOTE
set -euo pipefail
ENV_FILE="${REMOTE_ENV}"
for key in AI_PROVIDER GROQ_API_KEY GROQ_BASE_URL GROQ_MODEL; do
  val=\$(grep "^\${key}=" /tmp/groq.env.fragment | cut -d= -f2-)
  if grep -q "^\${key}=" "\${ENV_FILE}"; then
    sudo sed -i "s|^\${key}=.*|\${key}=\${val}|" "\${ENV_FILE}"
  else
    echo "\${key}=\${val}" | sudo tee -a "\${ENV_FILE}" >/dev/null
  fi
done
rm -f /tmp/groq.env.fragment
cd /opt/skilltrack/deploy/aws
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate backend
REMOTE

echo "Groq configured on ${EC2_HOST} (backend restarted)."
