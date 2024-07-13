import {getRegion} from './envs';
import {SFNClient} from '@aws-sdk/client-sfn';

let sfnClient: SFNClient;

export function initSFNClient() {
  if (!sfnClient) {
    sfnClient = new SFNClient({
      region: getRegion(),
    });
  }

  return sfnClient;
}
