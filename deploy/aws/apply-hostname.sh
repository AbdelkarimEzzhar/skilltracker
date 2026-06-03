#!/usr/bin/env bash
# Point a friendly hostname at the SkillTrack EC2 app and update CORS on the server.
#
# Free option (recommended): DuckDNS
#   1. Sign in at https://www.duckdns.org
#   2. Create subdomain "skilltrack" -> your Elastic IP
#   3. Run: APP_HOSTNAME=skilltrack.duckdns.org ./deploy/aws/apply-hostname.sh
#
# This computer only (no DNS): add to /etc/hosts:
#   51.21.63.138 skilltrack.local
#   Then: APP_HOSTNAME=skilltrack.local ./deploy/aws/apply-hostname.sh
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
INSTANCE_NAME="${STACK_PREFIX:-skilltrack}-app"
APP_HOSTNAME="${APP_HOSTNAME:?Set APP_HOSTNAME, e.g. skilltrack.duckdns.org}"
PUBLIC_IP="${PUBLIC_IP:-51.21.63.138}"
ROLE_NAME="${STACK_PREFIX:-skilltrack}-ec2-role"

# Strip scheme if provided
APP_HOSTNAME="${APP_HOSTNAME#http://}"
APP_HOSTNAME="${APP_HOSTNAME#https://}"
APP_HOSTNAME="${APP_HOSTNAME%%/*}"
APP_URL="http://${APP_HOSTNAME}"
CORS_ORIGIN="${CORS_ORIGIN:-${APP_URL},http://${PUBLIC_IP}}"

if [[ -n "${DUCKDNS_TOKEN:-}" && -n "${DUCKDNS_SUBDOMAIN:-}" ]]; then
  echo "Updating DuckDNS (${DUCKDNS_SUBDOMAIN}.duckdns.org) -> ${PUBLIC_IP}..."
  curl -fsS "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=${PUBLIC_IP}"
  echo ""
fi

echo "Attaching SSM policy (for remote config)..."
aws iam attach-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore \
  2>/dev/null || true

INSTANCE_ID="$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=${INSTANCE_NAME}" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text \
  --region "${REGION}")"

if [[ -z "${INSTANCE_ID}" || "${INSTANCE_ID}" == "None" ]]; then
  echo "No running instance tagged ${INSTANCE_NAME}. Deploy first or set INSTANCE_ID."
  exit 1
fi

echo "Instance: ${INSTANCE_ID}"
echo "Waiting for SSM agent (up to 3 minutes)..."
ONLINE=""
for _ in $(seq 1 18); do
  ONLINE="$(aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
    --query 'InstanceInformationList[0].PingStatus' \
    --output text \
    --region "${REGION}" 2>/dev/null || echo "")"
  if [[ "${ONLINE}" == "Online" ]]; then
    break
  fi
  sleep 10
done

apply_via_ssh() {
  local key
  key="$(mktemp)"
  ssh-keygen -t ed25519 -f "${key}" -N "" -q
  aws ec2-instance-connect send-ssh-public-key \
    --instance-id "${INSTANCE_ID}" \
    --instance-os-user ec2-user \
    --ssh-public-key "file://${key}.pub" \
    --region "${REGION}" >/dev/null
  ssh -i "${key}" -o StrictHostKeyChecking=no -o ConnectTimeout=20 "ec2-user@${PUBLIC_IP}" \
    "sudo sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=${CORS_ORIGIN}|' /opt/skilltrack/deploy/aws/.env && \
     cd /opt/skilltrack/deploy/aws && sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate backend && \
     curl -sf http://127.0.0.1/health"
  rm -f "${key}" "${key}.pub"
}

if [[ "${ONLINE}" != "Online" ]]; then
  echo "SSM not available; applying via EC2 Instance Connect..."
  apply_via_ssh
  echo ""
  echo "Use this URL in your browser:"
  echo "  ${APP_URL}"
  echo ""
  echo "Bookmark name can be \"Skill Track\" — the address bar will show ${APP_HOSTNAME}."
  exit 0
fi

REMOTE_SCRIPT=$(cat <<EOS
set -e
ENV_FILE=/opt/skilltrack/deploy/aws/.env
if [[ ! -f "\$ENV_FILE" ]]; then
  echo "App not found at \$ENV_FILE"
  exit 1
fi
if grep -q '^CORS_ORIGIN=' "\$ENV_FILE"; then
  sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=${CORS_ORIGIN}|' "\$ENV_FILE"
else
  echo "CORS_ORIGIN=${CORS_ORIGIN}" >> "\$ENV_FILE"
fi
cd /opt/skilltrack/deploy/aws
docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate backend
docker compose -f docker-compose.prod.yml restart nginx 2>/dev/null || true
curl -sf http://127.0.0.1/health && echo " OK"
EOS
)

CMD_ID="$(aws ssm send-command \
  --instance-ids "${INSTANCE_ID}" \
  --document-name AWS-RunShellScript \
  --parameters "commands=[$(printf '%s' "${REMOTE_SCRIPT}" | python3 -c 'import json,sys; print(json.dumps([sys.stdin.read()]))')]" \
  --region "${REGION}" \
  --query 'Command.CommandId' \
  --output text)"

echo "SSM command: ${CMD_ID}"
sleep 8
aws ssm get-command-invocation \
  --command-id "${CMD_ID}" \
  --instance-id "${INSTANCE_ID}" \
  --region "${REGION}" \
  --query '[Status,StandardOutputContent,StandardErrorContent]' \
  --output text

echo ""
echo "Use this URL in your browser:"
echo "  ${APP_URL}"
echo ""
echo "Bookmark name can be \"Skill Track\" — the address bar will show ${APP_HOSTNAME}."
