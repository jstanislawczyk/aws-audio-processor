import {S3Event, S3EventRecord} from 'aws-lambda';
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {initSQSClient} from './sqs-client';
import {AudioFileEvent} from '@audio-processor/schemas';
import * as path from 'node:path';

export const handler = async (event: S3Event): Promise<void> => {
    const records = event.Records;

    console.log('Received events: ', records.map((record) => record.s3.object.key));

    const promises = [];
    const sqsClient = initSQSClient();

    for (const record of records) {
        const sendSqsMessagePromise = sendAudioFileEvent(sqsClient, record);
        promises.push(sendSqsMessagePromise);
    }

    await Promise.all(promises);
}

const sendAudioFileEvent = (sqsClient: SQSClient, s3EventRecord: S3EventRecord) => {
    const s3Key = s3EventRecord.s3.object.key;
    const s3Bucket = s3EventRecord.s3.bucket.name;
    const audioId = path.parse(s3Key).name;
    const audioFileEvent: AudioFileEvent = {
        id: audioId,
        target: {
            bucketName: s3Bucket,
            dir: `processed/${audioId}`,
        },
        source: {
            bucketName: s3Bucket,
            key:s3Key,
        }
    };
    const sqsPublishCommand =  new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(audioFileEvent),
        MessageGroupId: 'audio-file-events',
        MessageDeduplicationId: audioId,
    });

    return sqsClient.send(sqsPublishCommand);
}
