import {S3Object} from './s3';

export interface AudioFileEvent {
  id: string;
  target: {
    bucketName: string;
    dir: string;
  };
  source: S3Object;
}

export interface FailedProcessingEvent extends AudioFileEvent {
  error: {
    Error: string,
    Cause: string,
  }
}

