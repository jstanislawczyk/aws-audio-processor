import {getRegion} from './envs';
import {SQSClient} from '@aws-sdk/client-sqs';

let sqsClient: SQSClient;

export function initSQSClient() {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: getRegion(),
    });
  }

  return sqsClient;
}
