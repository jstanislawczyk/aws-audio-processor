import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {initS3Client} from './s3-client';
import {PutObjectCommand} from '@aws-sdk/client-s3';
import path from 'path';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventBody = event.body;

    if (!eventBody) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'File name is required' }),
        };
    }

    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Bucket name is not provided' }),
        };
    }

    const fileName = JSON.parse(eventBody).fileName;
    const id = crypto.randomUUID();
    const s3Client = initS3Client();
    const date = new Date();
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: `uploaded/${year}/${month}/${day}/${id}/${fileName}`,
        Metadata: {
            id,
        },
    });

    const url = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 })

    return {
        statusCode: 200,
        body: JSON.stringify({ url }),
    }
}
