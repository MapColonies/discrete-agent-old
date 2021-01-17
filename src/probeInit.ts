import { hostname } from 'os';
import { DependencyContainer } from 'tsyringe';
import { Probe, ProbeConfig } from '@map-colonies/mc-probe';
import { IConfig } from 'config';
import axios from 'axios';
import { ILogger } from './common/interfaces';
import { Services } from './common/constants';

const getProbe = (container: DependencyContainer): Probe => {
  const logger = container.resolve<ILogger>(Services.LOGGER);
  const config = container.resolve<IConfig>(Services.CONFIG);
  const options = getProbeOptions(config);
  return new Probe(logger, options);
};

const getProbeOptions = (config: IConfig): ProbeConfig => {
  if (config.has('externalReadinessUrl')) {
    const externalReadinessUrl = config.get<string>('externalReadinessUrl');
    if (externalReadinessUrl !== '') {
      return {
        readiness: getExternalReadinessProbe(externalReadinessUrl),
      };
    }
  }
  return {};
};

const getExternalReadinessProbe = (url: string): (() => Promise<void>) => {
  const host = hostname();
  const notFoundIndex = -1;
  return async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      axios
        .get<string>(url)
        .then((res) => {
          if (res.data.indexOf(host) !== notFoundIndex) {
            resolve();
          } else {
            reject();
          }
        })
        .catch(reject);
    });
  };
};

export { getProbe };
