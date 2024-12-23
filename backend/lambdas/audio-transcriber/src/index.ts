import {initTranscribeClient} from './transcribe-client.js';
import {AudioFileEvent} from '@audio-processor/schemas';
import {StartTranscriptionJobCommand} from '@aws-sdk/client-transcribe';
import {initDocumentClient} from './document-clients';
import {UpdateCommand} from '@aws-sdk/lib-dynamodb';

interface AudioTranscribeEvent {
    audioEvent: AudioFileEvent;
    taskToken: string;
}

export const handler = async (audioTranscribeEvent: AudioTranscribeEvent): Promise<void> => {
    console.log('Received audio transcribe event: ', audioTranscribeEvent);

    const { audioEvent, taskToken } = audioTranscribeEvent;
    const { source, target } = audioEvent;
    const { bucketName: sourceBucketName, key } = source;
    const { bucketName: targetBucketName, dir } = target;
    const startTranscriptionJobCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: crypto.randomUUID(),
        LanguageCode: 'pl-PL',
        Media: {
            MediaFileUri: `s3://${sourceBucketName}/${key}`,
        },
        OutputBucketName: targetBucketName,
        OutputKey: `${dir}/transcription.json`,
    });
    const transcribeClient = initTranscribeClient();

    try {
        await transcribeClient.send(startTranscriptionJobCommand);
    } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(`Failed to start transcription job: ${errorMessage}`);
    }

    const documentClient = initDocumentClient();
    const updateCommand = new UpdateCommand({
        TableName: process.env.AUDIO_JOB_TABLE_NAME,
        Key: {
            id: audioEvent.id,
        },
        UpdateExpression: 'SET taskToken = :taskToken',
        ExpressionAttributeValues: {
            ':taskToken': taskToken,
        },
    });

    try {
        await documentClient.send(updateCommand);
    } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(`Failed to save task token: ${errorMessage}`);
    }
}
