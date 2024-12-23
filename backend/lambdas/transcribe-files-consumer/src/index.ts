import {S3Event, S3EventRecord} from 'aws-lambda';
import * as path from 'path';
import {DynamoDBDocumentClient, GetCommand, UpdateCommand} from '@aws-sdk/lib-dynamodb';
import {AudioJob, JobStatus} from '@audio-processor/schemas';
import {initSFNClient} from './sfn-client';
import { SendTaskSuccessCommand } from '@aws-sdk/client-sfn';
import {initDocumentClient} from './document-clients';

export const handler = async (event: S3Event): Promise<void> => {
    const records = event.Records;

    console.log('Received events: ', records.map((record) => record.s3.object.key));

    for (const record of records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error('Error processing record: ', error);
        }
    }
}

const processRecord = async (record: S3EventRecord) => {
    const documentClient = initDocumentClient();
    const audioId = getAudioId(record);

    const audioJob = await getAudioObject(documentClient, audioId);

    if (!audioJob) {
        console.error(`Audio job with id ${audioId} not found`);
        return;
    }

    const taskToken = audioJob.taskToken;

    if (!taskToken) {
        console.error(`Task token not found for audio job with id ${audioId}`);
        return;
    }

    await continueStepFunction(taskToken, audioId);
    await updateProcessingStatus(documentClient, audioId);
}

const getAudioId = (record: S3EventRecord): string => {
    const pathElements = path.dirname(record.s3.object.key).split('/');
    return pathElements[pathElements.length - 1];
}

const getAudioObject = async (documentClient: DynamoDBDocumentClient, audioId: string): Promise<AudioJob | undefined> => {
    const getCommand = new GetCommand({
        TableName: process.env.AUDIO_JOB_TABLE_NAME,
        Key: {
            id: audioId,
        },
    });

    const audioJob = await documentClient.send(getCommand);

    if (!audioJob.Item) {
        console.error(`Audio job with id ${audioId} not found`);
        return;
    }

    return audioJob.Item as AudioJob;
}

const continueStepFunction = async (taskToken: string, audioId: string): Promise<void> => {
    const sfnClient = initSFNClient();
    const sendTaskSuccessCommand = new SendTaskSuccessCommand({
        taskToken,
        output: JSON.stringify({
            audioId,
        })
    });

    await sfnClient.send(sendTaskSuccessCommand);
}

const updateProcessingStatus = async (documentClient: DynamoDBDocumentClient, audioId: string): Promise<void> => {
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
