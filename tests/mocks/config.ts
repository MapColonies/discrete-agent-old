import config from 'config';
import _ from 'lodash';
import { IConfig } from '../../src/common/interfaces';

const getMock = jest.fn();
const hasMock = jest.fn();

const configMock = {
  get: getMock,
  has: hasMock,
} as unknown as IConfig;

const setConfigValues = (values: Record<string, unknown>): void => {
  getMock.mockImplementation((key: string) => {
    const value = _.get(values, key) ?? config.get(key);
    return value;
  });
  hasMock.mockImplementation((key: string) => _.has(values, key) || config.has(key));
};

const registerDefaultConfig = (): void => {
  const config = {
    openapiConfig: {
      filePath: './openapi3.yaml',
      basePath: '/docs',
      jsonPath: '/api.json',
      uiPath: '/api',
    },
    logger: {
      level: 'info',
    },
    server: {
      port: '8080',
    },
    mountDir: '/layerSources',
    watcher: {
      watchDirectory: 'watch',
      rootDirNestingLevel: 1,
      watchOptions: {
        minTriggerDepth: 1,
        maxWatchDepth: 2,
        interval: 1000,
      },
      shpRetry: {
        retries: 2,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        randomize: false,
      },
    },
    overseer: {
      url: 'http://127.0.0.1:8081',
    },
    agentDB: {
      url: 'http://127.0.0.1:8082',
    },
    externalReadinessUrl: '',
    httpRetry: {
      attempts: 5,
      delay: 'exponential',
      shouldResetTimeout: true,
    },
  };
  setConfigValues(config);
};

export { getMock, hasMock, configMock, setConfigValues, registerDefaultConfig };
