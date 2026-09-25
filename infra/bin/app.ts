#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FlappyKiroStack } from '../lib/flappy-kiro-stack';

const app = new cdk.App();

new FlappyKiroStack(app, 'FlappyKiroStack', {
  // Pin to a specific account/region if needed, otherwise CDK uses the
  // current AWS CLI profile's default account and region.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:  process.env.CDK_DEFAULT_REGION,
  },
  description: 'Flappy Kiro — CodeCommit repo + Amplify hosting',
});
