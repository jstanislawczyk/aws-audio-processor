import {S3Event, S3EventRecord} from 'aws-lambda';

export const handler = async (event: S3Event): Promise<void> => {
    const records = event.Records;

    console.log('Received events: ', records.map((record) => record.s3.object.key));
}
