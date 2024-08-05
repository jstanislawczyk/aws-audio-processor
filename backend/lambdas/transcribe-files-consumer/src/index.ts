import {S3Event} from 'aws-lambda';
import * as path from 'path';
import {initDocumentClient} from './document-clients';
import {GetCommand, UpdateCommand} from '@aws-sdk/lib-dynamodb';
import {JobStatus} from '@audio-processor/schemas';
import {initSFNClient} from './sfn-client';
import { SendTaskSuccessCommand } from '@aws-sdk/client-sfn';

export const handler = async (event: S3Event): Promise<void> => {
    const records = event.Records;

    console.log('Received events: ', records.map((record) => record.s3.object.key));

    const documentClient = initDocumentClient();

    for (const record of records) {
        const pathElements = path.dirname(record.s3.object.key).split('/');
        const audioId = pathElements[pathElements.length - 1];

        const getCommand = new GetCommand({
            TableName: process.env.AUDIO_JOB_TABLE_NAME,
            Key: {
                id: audioId,
            },
        });

        const audioJob = await documentClient.send(getCommand);

        if (!audioJob.Item) {
            console.error(`Audio job with id ${audioId} not found`);
            continue;
        }

        const taskToken = audioJob.Item.taskToken;

        if (!taskToken) {
            console.error(`Task token not found for audio job with id ${audioId}`);
            continue;
        }

        const sfnClient = initSFNClient();
        const sendTaskSuccessCommand = new SendTaskSuccessCommand({
            taskToken,
            output: JSON.stringify({
                audioId,
            })
        });
        await sfnClient.send(sendTaskSuccessCommand);

        const updateCommand = new UpdateCommand({
            TableName: process.env.AUDIO_JOB_TABLE_NAME,
            Key: {
                id: audioId,
            },
            UpdateExpression: 'SET #status = :status REMOVE taskToken',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'COMPLETED' satisfies JobStatus,
            },
        });

        await documentClient.send(updateCommand);
    }
}
