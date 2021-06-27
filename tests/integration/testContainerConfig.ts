import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import { MCLogger, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from '../../src/common/constants';
import { FilesManager } from '../../src/layerCreator/models/filesManager';
import { AgentDbClient } from '../../src/serviceClients/agentDbClient';
import { filesManagerMock } from '../mocks/filesManager';
import { agentDbClientMock, init as initDb } from '../mocks/clients/agentDbClient';
import { configMock, registerDefaultConfig } from '../mocks/config';

function registerTestValues(): void {
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger({ log2console: true, level: 'error' }, service);

  initDb();
  registerDefaultConfig();

  container.register(Services.CONFIG, { useValue: configMock });
  container.register(Services.LOGGER, { useValue: logger });
  container.register(FilesManager, { useValue: filesManagerMock });
  container.register(AgentDbClient, { useValue: agentDbClientMock });
}

export { registerTestValues };
