import {SQSEvent, SQSRecord} from 'aws-lambda';
import {initSFNClient} from './sfn-client';
import {StartExecutionCommand} from '@aws-sdk/client-sfn';
import {initDocumentClient} from './document-clients';
import {AudioFileEvent, AudioJob} from '@audio-processor/schemas';
import {PutCommand} from '@aws-sdk/lib-dynamodb';

const sfnClient = initSFNClient();
const documentClient = initDocumentClient();

export const handler = async (event: SQSEvent): Promise<void> => {
    const records = event.Records;

    console.log('Received events: ', records.map((record) => record.body))

    const promises = [];

    for (const record of records) {
        const startExecutionPromise = startJob(record);
        promises.push(startExecutionPromise);
    }

    await Promise.all(promises);
}

const startJob = async (sqsRecord: SQSRecord): Promise<void> => {
    const audioEvent = JSON.parse(sqsRecord.body) as AudioFileEvent;
    await createAudioJobRecord(audioEvent);
    await startStateMachineExecution(sqsRecord.body);
}

const createAudioJobRecord = async (audioEvent: AudioFileEvent) => {
    const audioJob: AudioJob = {
        id: audioEvent.id,
        s3Object: audioEvent.source,
        createdAt: Date.now(),
        status: 'PROCESSING',
    };
    const putCommand: PutCommand = new PutCommand({
        TableName: process.env.AUDIO_JOB_TABLE_NAME,
        Item: audioJob,
    });

    return documentClient.send(putCommand);
}

const startStateMachineExecution = (sqsRecordBody: string) => {
    const startExecutionCommand =  new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        input: sqsRecordBody,
    });

    return sfnClient.send(startExecutionCommand);
}
