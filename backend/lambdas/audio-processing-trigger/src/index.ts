import {SQSEvent, SQSRecord} from 'aws-lambda';
import {initSFNClient} from './sfn-client';
import {SFNClient, StartExecutionCommand} from '@aws-sdk/client-sfn';

export const handler = async (event: SQSEvent): Promise<void> => {
    const records = event.Records;

    console.log('Received events: ', records.map((record) => record.body))

    const promises = [];
    const sfnClient = initSFNClient();

    for (const record of records) {
        const startExecutionPromise = createStartExecutionCommand(sfnClient, record);
        promises.push(startExecutionPromise);
    }

    await Promise.all(promises);
}

const createStartExecutionCommand = (sfnClient: SFNClient, sqsRecord: SQSRecord) => {
    const startExecutionCommand =  new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        input: sqsRecord.body
    });

    return sfnClient.send(startExecutionCommand);
}
