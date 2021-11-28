import { readFileSync } from 'fs';
import { resolve } from 'path';
import { container } from 'tsyringe';
import { Services } from '../../src/common/constants';
import { FilesManager } from '../../src/layerCreator/models/filesManager';
import { AgentDbClient } from '../../src/serviceClients/agentDbClient';
import { filesManagerMock, readAsStringSyncMock } from '../mocks/filesManager';
import { agentDbClientMock, init as initDb } from '../mocks/clients/agentDbClient';
import { configMock, registerDefaultConfig } from '../mocks/config';
import { loggerMock } from '../mocks/logger';

function registerTestValues(): void {
  const logger = loggerMock;

  initDb();
  registerDefaultConfig();
  loadClassifierData();

  container.register(Services.WATCHER_CONFIG, { useValue: '/layerSources/testDir/watch' });
  container.register(Services.CONFIG, { useValue: configMock });
  container.register(Services.LOGGER, { useValue: logger });
  container.register(FilesManager, { useValue: filesManagerMock });
  container.register(AgentDbClient, { useValue: agentDbClientMock });
}

function loadClassifierData(): void {
  const classificationConfigPath = resolve(__dirname, '../mockData/classification.json');
  const classificationConfig = readFileSync(classificationConfigPath, { encoding: 'utf8' });
  readAsStringSyncMock.mockReturnValue(classificationConfig);
}

export { registerTestValues };
