import {SQSEvent, SQSRecord} from 'aws-lambda';
import {initSFNClient} from './sfn-client';
import {StartExecutionCommand} from '@aws-sdk/client-sfn';
import {initDocumentClient} from './document-clients';
import {AudioFileEvent, AudioJob} from '@audio-processor/schemas';
import {PutCommand} from '@aws-sdk/lib-dynamodb';
import * as path from 'node:path';

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
    const documentClient = initDocumentClient();
    const audioJob: AudioJob = {
        id: audioEvent.id,
        uploadedObject: audioEvent.source,
        fileName: path.parse(audioEvent.source.key).base,
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
    const sfnClient = initSFNClient();
    const startExecutionCommand =  new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        input: sqsRecordBody,
    });

    return sfnClient.send(startExecutionCommand);
}
