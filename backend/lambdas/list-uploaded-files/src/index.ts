import {initDocumentClient} from './document-client';
import {AudioJob, AudioJobDto} from '@audio-processor/schemas';
import {APIGatewayProxyResult} from 'aws-lambda';
import {paginateScan} from '@aws-sdk/lib-dynamodb';

export const handler = async (): Promise<APIGatewayProxyResult> => {
    const jobs = await getJobs();

    return {
        statusCode: 200,
        body: JSON.stringify(jobs),
    }
}

const getJobs = async (): Promise<AudioJobDto[]> => {
    const documentClient = initDocumentClient();
    const paginator = paginateScan({ client: documentClient, pageSize: 100 }, {
        TableName: process.env.AUDIO_JOB_TABLE_NAME,
    });
    const audioJobDtos: AudioJobDto[] = [];

    for await (const page of paginator) {
        const items = (page.Items || []) as AudioJob[];
        const dtoItems = items.map(mapToDto);
        audioJobDtos.push(...dtoItems);
    }

    return audioJobDtos;
}

const mapToDto = (job: AudioJob): AudioJobDto => ({
    id: job.id,
    createdAt: job.createdAt,
    status: job.status,
    fileName: job.s3Object.key,
});
