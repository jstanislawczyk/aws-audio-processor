import {initTranscribeClient} from './transcribe-client.js';
import {AudioFileEvent} from '@audio-processor/schemas';
import {StartTranscriptionJobCommand} from '@aws-sdk/client-transcribe';
import path from 'path';

export const handler = async (audioFileEvent: AudioFileEvent): Promise<void> => {
    const {bucketName, objectKey} = audioFileEvent;
    const { name } = path.parse(objectKey);
    const startTranscriptionJobCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: crypto.randomUUID(),
        LanguageCode: 'pl-PL',
        Media: {
            MediaFileUri: `s3://${bucketName}/${objectKey}`,
        },
        OutputBucketName: bucketName,
        OutputKey: `${name}/transcription.json`,
    });
    const transcribeClient = initTranscribeClient();

    try {
        await transcribeClient.send(startTranscriptionJobCommand);
    } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(`Failed to start transcription job: ${errorMessage}`);
    }
}
