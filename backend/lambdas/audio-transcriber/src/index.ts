import {initTranscribeClient} from './transcribe-client.js';
import {AudioFileEvent} from '@audio-processor/schemas';
import {StartTranscriptionJobCommand} from '@aws-sdk/client-transcribe';

export const handler = async (audioFileEvent: AudioFileEvent): Promise<void> => {
    const { source, target } = audioFileEvent;
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
}
