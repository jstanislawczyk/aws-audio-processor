import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {initDDBClient} from './ddb-client';

let documentClient: DynamoDBDocumentClient;

export function initDocumentClient() {
  if (!documentClient) {
    const ddbClient = initDDBClient();
    documentClient = DynamoDBDocumentClient.from(ddbClient);
  }

  return documentClient;
}
