import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';

export class FlappyKiroStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── 1. CodeCommit repository ───────────────────────────────────────────────
    // Stores the Flappy Kiro source code. Local code is pushed here by the
    // deploy script before or after cdk deploy.
    const repo = new codecommit.Repository(this, 'FlappyKiroRepo', {
      repositoryName: 'flappy-kiro',
      description: 'Source code for the Flappy Kiro browser game',
    });

    // ── 2. IAM role for Amplify ────────────────────────────────────────────────
    // Amplify needs permission to clone from CodeCommit.
    const amplifyRole = new iam.Role(this, 'AmplifyRole', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Allows Amplify to read from the FlappyKiro CodeCommit repo',
    });

    // Grant Amplify read access to the specific repo.
    repo.grantRead(amplifyRole);

    // ── 3. Amplify app ─────────────────────────────────────────────────────────
    // Connects to the CodeCommit repo and builds/hosts the static game.
    const amplifyApp = new amplify.CfnApp(this, 'FlappyKiroApp', {
      name: 'flappy-kiro',
      description: 'Flappy Kiro — browser-based ghost game',
      iamServiceRole: amplifyRole.roleArn,

      // CodeCommit as the source provider.
      repository: repo.repositoryCloneUrlHttp,

      // Build spec: the game is a single static HTML file — no build step needed.
      // Amplify just needs to know which directory to serve.
      buildSpec: [
        'version: 1',
        'frontend:',
        '  phases:',
        '    build:',
        '      commands:',
        '        - echo "No build step required for static site"',
        '  artifacts:',
        '    baseDirectory: kiro-introduction-starter-kit',
        '    files:',
        '      - "**/*"',
        '  cache:',
        '    paths: []',
      ].join('\n'),

      // Enable basic auth on the app (off by default — flip to true to protect).
      enableBranchAutoDeletion: true,

      // Custom rewrite rule so all paths serve index.html (SPA-style).
      customRules: [
        {
          source: '</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|wav)$)([^.]+$)/>',
          target: '/index.html',
          status: '200',
        },
      ],
    });

    // ── 4. Amplify branch (main) ───────────────────────────────────────────────
    // Tracks the main branch. Every push to main triggers an automatic build.
    const mainBranch = new amplify.CfnBranch(this, 'MainBranch', {
      appId: amplifyApp.attrAppId,
      branchName: 'main',
      description: 'Production branch — auto-deploys on every push',
      enableAutoBuild: true,       // triggers a build on every CodeCommit push
      enablePullRequestPreview: false,
      stage: 'PRODUCTION',
    });

    // Ensure the branch is created after the app.
    mainBranch.addDependency(amplifyApp);

    // ── 5. Outputs ─────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repo.repositoryCloneUrlHttp,
      description: 'CodeCommit HTTPS clone URL — use this to push your local code',
      exportName: 'FlappyKiroRepoHttpUrl',
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlGrc', {
      value: repo.repositoryCloneUrlGrc,
      description: 'CodeCommit GRC clone URL (requires git-remote-codecommit)',
      exportName: 'FlappyKiroRepoGrcUrl',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.attrAppId,
      description: 'Amplify App ID',
      exportName: 'FlappyKiroAmplifyAppId',
    });

    new cdk.CfnOutput(this, 'AmplifyHostedUrl', {
      // Amplify hosted URL pattern: https://<branch>.<appId>.amplifyapp.com
      value: `https://main.${amplifyApp.attrAppId}.amplifyapp.com`,
      description: 'Live URL of the Flappy Kiro game',
      exportName: 'FlappyKiroHostedUrl',
    });
  }
}
