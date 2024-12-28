import {AudioFileEvent, S3Object} from '@audio-processor/schemas';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import {initS3Client} from './s3-client.js';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {
  NodeJsRuntimeStreamingBlobPayloadOutputTypes
} from '@smithy/types/dist-types/streaming-payload/streaming-blob-payload-output-types';
import * as path from 'path';

export const handler = async (audioFileEvent: AudioFileEvent): Promise<void> => {
    console.log('Received event:', JSON.stringify(audioFileEvent, null, 2));
    const tempDirPath = await initTempDir();
    const resultAudioFile = await processAudio(audioFileEvent, tempDirPath);
    await uploadFileToS3(resultAudioFile, audioFileEvent);
    await fs.rm(tempDirPath, { recursive: true });
}

const initTempDir = async (): Promise<string> => {
    const prefix = process.env.IS_LAMBDA ? '/tmp/' : './tmp/';
    await fs.mkdir(prefix, { recursive: true });
    return await fs.mkdtemp(prefix);
}

const processAudio = async (event: AudioFileEvent, tempDirPath: string): Promise<string> => {
    const [
      introFilePath,
      audioFilePath,
    ] = await Promise.all([
        fetchIntroFile(tempDirPath),
        fetchAudioFile(event, tempDirPath),
    ]);
    await transformAudio(audioFilePath, tempDirPath);

    return mergeAudioFiles(introFilePath, audioFilePath, tempDirPath);
}

const transformAudio = async (audioFilePath: string, tempDirPath: string): Promise<string> => {
    const transformedAudioPath = `${tempDirPath}/transformed.mp3`;

    return new Promise((resolve, reject) => {
        ffmpeg(audioFilePath)
          .toFormat('mp3')
          .audioBitrate('44100')
          .save(transformedAudioPath)
          .on('end', () => {
              console.log('File has been transformed successfully');
              return resolve(transformedAudioPath);
          })
          .on('error', (error: Error) =>{
              console.log('Failed to transform audio file: ', error.message);
              return reject(error);
          });
    });
}

const mergeAudioFiles = (introFilePath: string, audioFilePath: string, tempDirPath: string): Promise<string> => {
    const mergedAudioFilePath = `${tempDirPath}/merged.mp3`;

    return new Promise((resolve, reject) => {
        ffmpeg(introFilePath)
            .input(audioFilePath)
            .mergeToFile(mergedAudioFilePath, `${tempDirPath}/tmp/`)
            .on('end', function() {
                console.log('files have been merged successfully');
                return resolve(mergedAudioFilePath);
            })
            .on('error', function(err) {
                console.log('an error happened: ', err.message);
                return reject(err);
            });
    });
}

const fetchAudioFile = async (event: AudioFileEvent, tempDirPath: string): Promise<string> => {
    const audioFilePath = buildLocalFilePath(tempDirPath, event.source.key);

    console.log('Fetching audio file from S3:', JSON.stringify(event));

    const audioFile = await fetchS3File(event.source);
    await fs.writeFile(audioFilePath, audioFile);

    return audioFilePath;
}

const fetchIntroFile = async (tempDirPath: string): Promise<string> => {
    // Provide predefined intro file in given bucket and with given key
    const bucketName = process.env.AUDIO_BUCKET_NAME || '';
    const introFileS3Key = 'intro/intro.mp3';
    const s3ObjectLocation: S3Object = {
        bucketName,
        key: introFileS3Key,
    };
    const introFilePath = buildLocalFilePath(tempDirPath, introFileS3Key);

    console.log('Fetching audio file from S3:', JSON.stringify(s3ObjectLocation));

    const audioFile = await fetchS3File(s3ObjectLocation);
    await fs.writeFile(introFilePath, audioFile);

    return introFilePath;
}

const buildLocalFilePath = (tempDirPath: string, key: string): string => {
    const fileName = path.basename(key);
    return `${tempDirPath}/${fileName}`;
}

const fetchS3File = async (s3Object: S3Object): Promise<NodeJsRuntimeStreamingBlobPayloadOutputTypes> => {
    const s3Client = initS3Client();
    const {bucketName, key} = s3Object;
    const getObjectCommand = new GetObjectCommand({
        Bucket:bucketName,
        Key: key,
    });
    let data;

    try {
        data = await s3Client.send(getObjectCommand);
    } catch (err) {
        console.log('Error: ', err);
        throw new Error(`Failed to fetch file from S3. Bucket: ${bucketName}, Key: ${key}`);
    }

    if (data.Body === undefined) {
        throw new Error(`Body is undefined. Bucket: ${bucketName}, Key: ${key}`);
    }

    return data.Body as NodeJsRuntimeStreamingBlobPayloadOutputTypes;
}

const uploadFileToS3 = async (mergedFilePath: string, audioFileEvent: AudioFileEvent): Promise<void> => {
    const s3Client = initS3Client();
    const { bucketName, dir } = audioFileEvent.target;
    const ext = path.parse(mergedFilePath).ext;
    const targetKey = `${dir}/output${ext}`;
    const fileContent = await fs.readFile(mergedFilePath);

    const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: targetKey,
        Body: fileContent,
    });

    try {
        await s3Client.send(putObjectCommand);
    } catch (err) {
        console.log('Error: ', err);
        throw new Error(`Failed to upload file to S3. Bucket: ${bucketName}, Key: ${targetKey}`);
    }
}
