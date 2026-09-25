# Flappy Kiro — AWS Infrastructure

CDK TypeScript stack that hosts Flappy Kiro on AWS using **CodeCommit** (source repository) and **AWS Amplify** (CI/CD + hosting).

## Architecture

```
Local git repo
      │  git push codecommit main
      ▼
AWS CodeCommit (flappy-kiro)
      │  webhook (automatic)
      ▼
AWS Amplify
  ├── Build: serves kiro-introduction-starter-kit/ as static site
  └── Host:  https://main.<appId>.amplifyapp.com
```

Every push to the `main` branch in CodeCommit triggers an Amplify build and deploy automatically.

---

## Prerequisites

Install these tools before running the deploy script.

### 1. Node.js ≥ 18 and npm
```bash
# macOS — via Homebrew
brew install node

# or download from https://nodejs.org
```

### 2. AWS CDK CLI
```bash
npm install -g aws-cdk
cdk --version  # should print 2.x.x
```

### 3. AWS CLI v2
```bash
# macOS — via Homebrew
brew install awscli

# or follow https://aws.amazon.com/cli/
aws --version  # should print aws-cli/2.x.x
```

### 4. Configure AWS credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, default region (e.g. us-east-1), output format (json)
```

Your IAM user/role needs permissions for: CloudFormation, CodeCommit, Amplify, IAM, S3 (for CDK bootstrap bucket).

### 5. git-remote-codecommit (GRC)
GRC lets git authenticate with CodeCommit using your AWS credentials — no SSH keys or HTTPS passwords needed.

```bash
pip install git-remote-codecommit

# Verify
git remote -v  # after adding the remote you'll see codecommit://...
```

---

## One-command deploy

From the repository root:

```bash
./deploy.sh
```

This script will:
1. Run `npm install` inside `infra/`
2. Bootstrap the CDK environment in your AWS account (`cdk bootstrap`)
3. Deploy the CloudFormation stack (creates CodeCommit repo + Amplify app)
4. Add a `codecommit` git remote pointing to the new repo
5. Push your local `main` branch to CodeCommit (triggers the first Amplify build)
6. Print the live game URL

**First deploy takes ~3–5 minutes.** Subsequent deploys (after a `git push codecommit main`) take ~1–2 minutes.

---

## Manual steps (alternative to deploy.sh)

```bash
# 1. Install dependencies
cd infra
npm install

# 2. Bootstrap (once per AWS account/region)
npx cdk bootstrap

# 3. Deploy the stack
npx cdk deploy FlappyKiroStack --require-approval never --outputs-file outputs.json

# 4. Add the CodeCommit remote (use the GRC URL from outputs.json)
git remote add codecommit <RepositoryCloneUrlGrc from outputs.json>

# 5. Push code — triggers Amplify build
git push codecommit main
```

---

## Stack outputs

After `cdk deploy` the following values are printed (and saved to `infra/outputs.json`):

| Output | Description |
|---|---|
| `RepositoryCloneUrlHttp` | HTTPS clone URL for the CodeCommit repo |
| `RepositoryCloneUrlGrc` | GRC clone URL (recommended — uses AWS credentials) |
| `AmplifyAppId` | Amplify application ID |
| `AmplifyHostedUrl` | Live game URL: `https://main.<appId>.amplifyapp.com` |

---

## Useful commands

```bash
# Check Amplify build status
aws amplify list-jobs \
  --app-id $(node -e "const o=require('./outputs.json');process.stdout.write(o.FlappyKiroStack.FlappyKiroAmplifyAppId)") \
  --branch-name main

# Redeploy after code changes
git add .
git commit -m "your message"
git push codecommit main   # Amplify auto-builds on every push

# Tear down all AWS resources
cd infra && npx cdk destroy FlappyKiroStack
```

---

## Project structure

```
infra/
├── bin/
│   └── app.ts              # CDK entry point
├── lib/
│   └── flappy-kiro-stack.ts  # Stack definition
├── cdk.json                # CDK config
├── package.json            # Dependencies (aws-cdk-lib, constructs)
├── tsconfig.json           # TypeScript config
└── README.md               # This file

deploy.sh                   # One-command deploy script (repo root)
```
