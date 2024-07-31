import {S3Object} from './s3';

export interface AudioFileEvent {
  id: string;
  target: {
    bucketName: string;
    dir: string;
  };
  source: S3Object;
}
