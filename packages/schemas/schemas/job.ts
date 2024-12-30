import {S3Object} from './s3';

export interface AudioJob {
  id: string;
  s3Object: S3Object;
  createdAt: number;
  status: JobStatus;
  taskToken?: string;
}

export interface AudioJobDto {
  id: string;
  createdAt: number;
  status: JobStatus;
  fileName: string;
}

export type JobStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'
