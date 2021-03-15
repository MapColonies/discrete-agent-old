import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import config from 'config';
import { MCLogger, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from '../../src/common/constants';
import { FilesManager } from '../../src/layerCreator/models/filesManager';
import { filesManagerMock } from '../mocks/filesManager';
import { AgentDbClient } from '../../src/serviceClients/agentDbClient';
import { agentDbClientMock, init as initDb } from '../mocks/clients/agentDbClient';

function registerTestValues(): void {
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger({ log2console: true, level: 'error' }, service);

  initDb();

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });
  container.register(FilesManager, { useValue: filesManagerMock });
  container.register(AgentDbClient, { useValue: agentDbClientMock });
}

export { registerTestValues };
