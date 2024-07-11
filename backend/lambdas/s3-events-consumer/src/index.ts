import {S3Event, S3EventRecord} from 'aws-lambda';
import {initSFNClient} from './sfn-clients';
import {StartExecutionCommand} from '@aws-sdk/client-sfn';

export const handler = async (event: S3Event): Promise<void> => {
    console.log('Received events: ', event.Records.map((record) => record.s3.object.key))
    const records = event.Records;
    const promises = [];
    const sfnClient = initSFNClient();

    for (const record of records) {
        const startExecutionCommand = createStartExecutionCommand(record);
        const startExecutionPromise = sfnClient.send(startExecutionCommand);
        promises.push(startExecutionPromise);
    }

    await Promise.all(promises);
}

const createStartExecutionCommand = (s3EventRecord: S3EventRecord) => {
    const s3Data = s3EventRecord.s3;
    const stateMachineEvent = {
        bucketName: s3Data.bucket.name,
        objectKey: s3Data.object.key,
    }

    return new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        input: JSON.stringify(stateMachineEvent),
    });
}
