import {TranscribeClient} from '@aws-sdk/client-transcribe';
import {getRegion} from './envs.js';

let transcribeClient: TranscribeClient;

export function initTranscribeClient() {
  if (!transcribeClient) {
    transcribeClient = new TranscribeClient({
      region: getRegion(),
    });
  }

  return transcribeClient;
}
