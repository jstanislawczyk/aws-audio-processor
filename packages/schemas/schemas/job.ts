import {S3Object} from './s3';

export interface AudioJob {
  id: string;
  uploadedObject: S3Object;
  fileName: string;
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
