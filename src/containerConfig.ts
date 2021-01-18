import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import config, { IConfig } from 'config';
import { Probe } from '@map-colonies/mc-probe';
import { MCLogger, ILoggerConfig, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from './common/constants';
import { getProbe } from './probeInit';
import { ILogger } from './common/interfaces';

function registerExternalValues(): void {
  const loggerConfig = config.get<ILoggerConfig>('logger');
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger(loggerConfig, service);
  container.register<IConfig>(Services.CONFIG, { useValue: config });
  container.register<ILogger>(Services.LOGGER, { useValue: logger });
  container.register<Probe>(Probe, { useFactory: getProbe });
}

export { registerExternalValues };
