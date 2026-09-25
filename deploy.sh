#!/usr/bin/env bash
# deploy.sh — Deploy Flappy Kiro to AWS (CodeCommit + Amplify)
#
# What this script does:
#   1. Installs CDK dependencies (first run only)
#   2. Bootstraps the CDK environment (first run only)
#   3. Deploys the CDK stack (creates CodeCommit repo + Amplify app)
#   4. Adds the CodeCommit repo as a git remote
#   5. Pushes the local main branch to CodeCommit (triggers Amplify build)
#   6. Prints the live Amplify URL
#
# Prerequisites (see infra/README.md for installation links):
#   - Node.js >= 18 and npm
#   - AWS CDK CLI:  npm install -g aws-cdk
#   - AWS CLI v2:   https://aws.amazon.com/cli/
#   - git-remote-codecommit (GRC): pip install git-remote-codecommit
#   - AWS credentials configured: aws configure
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh

set -euo pipefail

STACK_NAME="FlappyKiroStack"
INFRA_DIR="$(cd "$(dirname "$0")/infra" && pwd)"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_NAME="codecommit"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # no colour

log()  { echo -e "${BLUE}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✔ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }

# ── 1. Install CDK dependencies ───────────────────────────────────────────────
log "Installing CDK dependencies..."
cd "$INFRA_DIR"
npm install --silent
ok "Dependencies installed"

# ── 2. Bootstrap CDK environment (safe to run multiple times) ─────────────────
log "Bootstrapping CDK environment..."
npx cdk bootstrap
ok "CDK bootstrap complete"

# ── 3. Deploy the CDK stack ───────────────────────────────────────────────────
log "Deploying CDK stack: $STACK_NAME..."
npx cdk deploy "$STACK_NAME" --require-approval never --outputs-file outputs.json
ok "Stack deployed"

# ── 4. Read stack outputs ─────────────────────────────────────────────────────
log "Reading stack outputs..."

# Extract values from the CDK outputs JSON file.
REPO_GRC_URL=$(node -e "
  const o = require('./outputs.json');
  console.log(o['$STACK_NAME']['FlappyKiroRepoGrcUrl']);
")

HOSTED_URL=$(node -e "
  const o = require('./outputs.json');
  console.log(o['$STACK_NAME']['FlappyKiroHostedUrl']);
")

ok "CodeCommit GRC URL : $REPO_GRC_URL"
ok "Amplify hosted URL : $HOSTED_URL"

# ── 5. Push local code to CodeCommit ─────────────────────────────────────────
cd "$REPO_DIR"

# Add the CodeCommit remote (skip if it already exists).
if git remote get-url "$REMOTE_NAME" &>/dev/null; then
  warn "Remote '$REMOTE_NAME' already exists — updating URL"
  git remote set-url "$REMOTE_NAME" "$REPO_GRC_URL"
else
  log "Adding git remote '$REMOTE_NAME'..."
  git remote add "$REMOTE_NAME" "$REPO_GRC_URL"
fi

log "Pushing local main branch to CodeCommit..."
git push "$REMOTE_NAME" main
ok "Code pushed — Amplify build triggered automatically"

# ── 6. Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎮 Flappy Kiro is deploying!${NC}"
echo -e "${GREEN}  Live URL: ${HOSTED_URL}${NC}"
echo -e "${GREEN}  (Amplify build takes ~1-2 minutes on first deploy)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  To watch the build progress, run:"
echo "  aws amplify list-jobs --app-id \$(cat infra/outputs.json | node -e \\"
echo "    \"const o=require('./infra/outputs.json');process.stdout.write(o['$STACK_NAME']['FlappyKiroAmplifyAppId'])\")"
echo "    --branch-name main"
