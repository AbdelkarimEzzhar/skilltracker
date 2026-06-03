#!/usr/bin/env bash
# ONE-TIME: copy local MongoDB to EC2 (overwrites production data).
# Do not run again unless you intentionally want to replace live data with localhost.
#
# Prerequisites:
#   - Local MongoDB running with your data (skilltrack_db)
#   - mongodump installed locally
#   - AWS CLI + SSH access to EC2 (Instance Connect)
#
# Usage:
#   LOCAL_MONGO_URI='mongodb://localhost:27017/skilltrack_db' ./deploy/aws/sync-local-db-to-ec2.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_MONGO_URI="${LOCAL_MONGO_URI:-mongodb://localhost:27017/skilltrack_db}"
EC2_HOST="${EC2_HOST:-51.21.63.138}"
INSTANCE_ID="${INSTANCE_ID:-i-00392517f1f4918f5}"
REGION="${AWS_REGION:-eu-north-1}"
COMPOSE_DIR="/opt/skilltrack/deploy/aws"
SSH_KEY="${SSH_KEY:-/tmp/skilltrack-ec2-key}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }
}

require_cmd mongodump
require_cmd aws
require_cmd ssh
require_cmd scp

if [[ ! -f "${SSH_KEY}" ]]; then
  ssh-keygen -t ed25519 -f "${SSH_KEY}" -N "" -q
fi

STAGING="$(mktemp -d)"
trap 'rm -rf "${STAGING}"' EXIT

echo "==> Dumping local database from ${LOCAL_MONGO_URI}"
mongodump --uri="${LOCAL_MONGO_URI}" --out="${STAGING}/dump"

DB_PATH="${LOCAL_MONGO_URI%%\?*}"
DB_NAME="$(basename "${DB_PATH}")"
if [[ "${DB_NAME}" == "${DB_PATH}" || -z "${DB_NAME}" ]]; then
  DB_NAME="$(ls "${STAGING}/dump" | head -1)"
fi
if [[ -z "${DB_NAME}" || ! -d "${STAGING}/dump/${DB_NAME}" ]]; then
  echo "Dump failed or empty. Is local MongoDB running with data?"
  exit 1
fi

PROD_DB="${PROD_DB:-skilltrack_db}"
BSON_FILES="$(find "${STAGING}/dump/${DB_NAME}" -name '*.bson' | wc -l)"
echo "    Local database '${DB_NAME}' (${BSON_FILES} collections) -> production '${PROD_DB}'"

ARCHIVE="${STAGING}/skilltrack-mongo-dump.tar.gz"
tar -czf "${ARCHIVE}" -C "${STAGING}/dump" "${DB_NAME}"

echo "==> Uploading dump to EC2 (${EC2_HOST})"
aws ec2-instance-connect send-ssh-public-key \
  --instance-id "${INSTANCE_ID}" \
  --instance-os-user ec2-user \
  --ssh-public-key "file://${SSH_KEY}.pub" \
  --region "${REGION}" >/dev/null

scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${ARCHIVE}" "ec2-user@${EC2_HOST}:/tmp/skilltrack-mongo-dump.tar.gz"

echo "==> Restoring into production MongoDB (replaces existing data)"
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "ec2-user@${EC2_HOST}" \
  "LOCAL_DB='${DB_NAME}' PROD_DB='${PROD_DB}' COMPOSE_DIR='${COMPOSE_DIR}' bash -s" <<'REMOTE'
set -euo pipefail
cd "${COMPOSE_DIR}"
sudo rm -rf /tmp/skilltrack-restore && sudo mkdir -p /tmp/skilltrack-restore
sudo tar -xzf /tmp/skilltrack-mongo-dump.tar.gz -C /tmp/skilltrack-restore
echo "Restoring ${LOCAL_DB} -> ${PROD_DB}"
MONGO_CID="$(sudo docker compose -f docker-compose.prod.yml ps -q mongo)"
sudo docker compose -f docker-compose.prod.yml stop backend 2>/dev/null || true
sudo docker compose -f docker-compose.prod.yml exec -T mongo mongosh --quiet --eval "db.getSiblingDB('${PROD_DB}').dropDatabase()" || true
sudo docker cp "/tmp/skilltrack-restore/${LOCAL_DB}" "${MONGO_CID}:/tmp/restoredb"
sudo docker compose -f docker-compose.prod.yml exec -T mongo mongorestore --drop --db="${PROD_DB}" /tmp/restoredb
sudo docker compose -f docker-compose.prod.yml up -d
sleep 5
curl -sf http://127.0.0.1/health && echo " API healthy"
REMOTE

echo ""
echo "Done. Open http://${EC2_HOST}/login — you should see the same users and competences as localhost."
echo "Student passwords are unchanged from your local DB (not reset to Admin@123)."
