import {getRegion} from './envs';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';

let ddbClient: DynamoDBClient;

export function initDDBClient() {
  if (!ddbClient) {
    ddbClient = new DynamoDBClient({
      region: getRegion(),
    });
  }

  return ddbClient;
}
