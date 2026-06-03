#!/usr/bin/env bash
# Deploy SkillTrack to a single EC2 instance (AWS Free Tier friendly).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REGION="${AWS_REGION:-eu-north-1}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
STACK_PREFIX="${STACK_PREFIX:-skilltrack}"
BUCKET="${DEPLOY_BUCKET:-${STACK_PREFIX}-deploy-959516291833}"
ARCHIVE_KEY="skilltrack-deploy.tar.gz"
SG_NAME="${STACK_PREFIX}-web-sg"
ROLE_NAME="${STACK_PREFIX}-ec2-role"
PROFILE_NAME="${STACK_PREFIX}-ec2-profile"
INSTANCE_NAME="${STACK_PREFIX}-app"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1"; exit 1; }
}

require_cmd aws
require_cmd tar

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "AWS account: ${ACCOUNT_ID}"
echo "Region: ${REGION}"

if [[ -z "${JWT_SECRET:-}" ]]; then
  JWT_SECRET="$(openssl rand -hex 32)"
  echo "Generated JWT_SECRET for this deployment."
fi

MONGO_URI="${MONGO_URI:-mongodb://mongo:27017/skilltrack_db}"
GROQ_API_KEY="${GROQ_API_KEY:-}"

# Optional friendly hostname (no spaces), e.g. skilltrack.duckdns.org
if [[ -n "${APP_HOSTNAME:-}" ]]; then
  APP_HOSTNAME="${APP_HOSTNAME#http://}"
  APP_HOSTNAME="${APP_HOSTNAME#https://}"
  APP_HOSTNAME="${APP_HOSTNAME%%/*}"
fi

echo "Creating deployment archive..."
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

tar -czf "${STAGING}/${ARCHIVE_KEY}" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.tsbuildinfo' \
  -C "${ROOT_DIR}" \
  skilltrack-backend skilltrack-frontend deploy/aws backup_mars_2026

if ! aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "Creating S3 bucket ${BUCKET}..."
  if [[ "${REGION}" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}"
  else
    aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}" \
      --create-bucket-configuration "LocationConstraint=${REGION}"
  fi
  aws s3api put-public-access-block --bucket "${BUCKET}" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
fi

aws s3 cp "${STAGING}/${ARCHIVE_KEY}" "s3://${BUCKET}/${ARCHIVE_KEY}" --region "${REGION}"

VPC_ID="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region "${REGION}")"
SUBNET_ID="$(aws ec2 describe-subnets --filters Name=vpc-id,Values="${VPC_ID}" Name=default-for-az,Values=true --query 'Subnets[0].SubnetId' --output text --region "${REGION}")"
AMI_ID="$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=x86_64" --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text --region "${REGION}")"

SG_ID="$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${SG_NAME}" --query 'SecurityGroups[0].GroupId' --output text --region "${REGION}" 2>/dev/null || true)"
if [[ -z "${SG_ID}" || "${SG_ID}" == "None" ]]; then
  SG_ID="$(aws ec2 create-security-group --group-name "${SG_NAME}" --description "SkillTrack HTTP" --vpc-id "${VPC_ID}" --query GroupId --output text --region "${REGION}")"
  aws ec2 authorize-security-group-ingress --group-id "${SG_ID}" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "${REGION}"
  aws ec2 authorize-security-group-ingress --group-id "${SG_ID}" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "${REGION}" || true
fi

TRUST_POLICY='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
if ! aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  aws iam create-role --role-name "${ROLE_NAME}" --assume-role-policy-document "${TRUST_POLICY}" >/dev/null
  aws iam attach-role-policy --role-name "${ROLE_NAME}" \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore 2>/dev/null || true
  aws iam put-role-policy --role-name "${ROLE_NAME}" --policy-name "${ROLE_NAME}-s3" --policy-document "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    }
  ]
}
EOF
)"
fi

if ! aws iam get-instance-profile --instance-profile-name "${PROFILE_NAME}" >/dev/null 2>&1; then
  aws iam create-instance-profile --instance-profile-name "${PROFILE_NAME}" >/dev/null
  aws iam add-role-to-instance-profile --instance-profile-name "${PROFILE_NAME}" --role-name "${ROLE_NAME}"
  sleep 10
fi

ALLOCATION_ID="$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=${STACK_PREFIX}-eip" --query 'Addresses[0].AllocationId' --output text --region "${REGION}" 2>/dev/null || true)"
if [[ -z "${ALLOCATION_ID}" || "${ALLOCATION_ID}" == "None" ]]; then
  ALLOCATION_ID="$(aws ec2 allocate-address --domain vpc --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${STACK_PREFIX}-eip}]" --query AllocationId --output text --region "${REGION}")"
fi
PUBLIC_IP="$(aws ec2 describe-addresses --allocation-ids "${ALLOCATION_ID}" --query 'Addresses[0].PublicIp' --output text --region "${REGION}")"
if [[ -n "${APP_HOSTNAME:-}" ]]; then
  APP_URL="http://${APP_HOSTNAME}"
  CORS_ORIGIN="${CORS_ORIGIN:-${APP_URL},http://${PUBLIC_IP}}"
else
  APP_URL="http://${PUBLIC_IP}"
  CORS_ORIGIN="${CORS_ORIGIN:-${APP_URL}}"
fi

USER_DATA_FILE="$(mktemp)"
sed \
  -e "s|__REGION__|${REGION}|g" \
  -e "s|__BUCKET__|${BUCKET}|g" \
  -e "s|__ARCHIVE_KEY__|${ARCHIVE_KEY}|g" \
  -e "s|__APP_URL__|${APP_URL}|g" \
  -e "s|__CORS_ORIGIN__|${CORS_ORIGIN}|g" \
  -e "s|__JWT_SECRET__|${JWT_SECRET}|g" \
  -e "s|__MONGO_URI__|${MONGO_URI}|g" \
  -e "s|__GROQ_API_KEY__|${GROQ_API_KEY}|g" \
  "${ROOT_DIR}/deploy/aws/ec2-user-data.sh" > "${USER_DATA_FILE}"
USER_DATA_B64="$(base64 -w0 < "${USER_DATA_FILE}")"

EXISTING_INSTANCE="$(aws ec2 describe-instances --filters "Name=tag:Name,Values=${INSTANCE_NAME}" "Name=instance-state-name,Values=pending,running,stopping" --query 'Reservations[0].Instances[0].InstanceId' --output text --region "${REGION}" 2>/dev/null || true)"

if [[ -n "${EXISTING_INSTANCE}" && "${EXISTING_INSTANCE}" != "None" ]]; then
  if [[ "${FORCE_REDEPLOY:-}" == "1" ]]; then
    echo "Terminating instance ${EXISTING_INSTANCE} (FORCE_REDEPLOY=1)..."
    aws ec2 terminate-instances --instance-ids "${EXISTING_INSTANCE}" --region "${REGION}" >/dev/null
    aws ec2 wait instance-terminated --instance-ids "${EXISTING_INSTANCE}" --region "${REGION}"
    EXISTING_INSTANCE=""
  else
    echo "Instance ${EXISTING_INSTANCE} already exists. Set FORCE_REDEPLOY=1 to replace it."
    INSTANCE_ID="${EXISTING_INSTANCE}"
  fi
fi

if [[ -z "${EXISTING_INSTANCE}" || "${EXISTING_INSTANCE}" == "None" ]]; then
  echo "Launching EC2 instance (${INSTANCE_TYPE})..."
  INSTANCE_ID="$(aws ec2 run-instances \
    --image-id "${AMI_ID}" \
    --instance-type "${INSTANCE_TYPE}" \
    --subnet-id "${SUBNET_ID}" \
    --security-group-ids "${SG_ID}" \
    --iam-instance-profile "Name=${PROFILE_NAME}" \
    --user-data "${USER_DATA_B64}" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3","DeleteOnTermination":true,"Encrypted":true}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}}]" \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region "${REGION}")"

  echo "Waiting for instance ${INSTANCE_ID} to enter running state..."
  aws ec2 wait instance-running --instance-ids "${INSTANCE_ID}" --region "${REGION}"

  ASSOCIATION="$(aws ec2 describe-addresses --allocation-ids "${ALLOCATION_ID}" --query 'Addresses[0].AssociationId' --output text --region "${REGION}")"
  if [[ -z "${ASSOCIATION}" || "${ASSOCIATION}" == "None" ]]; then
    aws ec2 associate-address --instance-id "${INSTANCE_ID}" --allocation-id "${ALLOCATION_ID}" --region "${REGION}" >/dev/null
  fi
fi

if [[ -n "${EXISTING_INSTANCE:-}" && "${EXISTING_INSTANCE}" != "None" && "${FORCE_REDEPLOY:-}" != "1" ]]; then
  PUBLIC_IP="$(aws ec2 describe-addresses --allocation-ids "${ALLOCATION_ID}" --query 'Addresses[0].PublicIp' --output text --region "${REGION}")"
  APP_URL="http://${PUBLIC_IP}"
fi

echo ""
echo "Deployment started."
echo "  App URL (after bootstrap): ${APP_URL}"
echo "  Health check: ${APP_URL}/health"
echo "  Instance ID: ${INSTANCE_ID}"
echo ""
echo "Waiting for /health (this can take 10-20 minutes on first boot)..."

for i in $(seq 1 60); do
  if curl -fsS --max-time 5 "${APP_URL}/health" >/dev/null 2>&1; then
    echo ""
    echo "SkillTrack is live at ${APP_URL}"
    echo "Demo login: admin@skilltrack.com / Admin@123"
    exit 0
  fi
  echo "  attempt ${i}/60..."
  sleep 20
done

echo ""
echo "Instance is up but the app is not healthy yet. Check logs on the instance:"
echo "  aws ssm start-session --target ${INSTANCE_ID} --region ${REGION}"
echo "  sudo docker compose -f /opt/skilltrack/deploy/aws/docker-compose.prod.yml logs"
exit 1
