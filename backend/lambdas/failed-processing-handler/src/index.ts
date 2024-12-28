import {initDocumentClient} from './document-client';
import {FailedProcessingEvent, JobStatus} from '@audio-processor/schemas';
import {UpdateCommand} from '@aws-sdk/lib-dynamodb';

const documentClient = initDocumentClient();

export const handler = async (event: FailedProcessingEvent): Promise<void> => {
    console.log(`Update ${event.id} job status to failed`);
    console.log('Error:', JSON.stringify(event.error));

    await updateJob(event.id);
}

export const updateJob = async (jobId: string): Promise<void> => {
    const updateCommand: UpdateCommand = new UpdateCommand({
        TableName: process.env.AUDIO_JOB_TABLE_NAME,
        Key: {
            id: jobId,
        },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': 'FAILED' satisfies JobStatus,
        },
    });

    await documentClient.send(updateCommand);
}
