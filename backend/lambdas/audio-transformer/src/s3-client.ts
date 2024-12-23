import {S3Client} from '@aws-sdk/client-s3';
import {getRegion} from './envs.js';

let s3Client: S3Client;

export function initS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getRegion(),
    });
  }

  return s3Client;
}
