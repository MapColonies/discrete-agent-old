import { readFileSync } from 'fs';
import { resolve } from 'path';
import axiosMock from 'jest-mock-axios';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { Trigger } from '../../../../src/layerCreator/models/trigger';
import { overseerClientMock, ingestDiscreteLayerMock } from '../../../mocks/clients/overseerClient';
import { agentDbClientMock, updateDiscreteStatusMock, getDiscreteStatusMock } from '../../../mocks/clients/agentDbClient';
import { validateLayerFilesExistsMock, validateShpFilesExistsMock, filesManagerMock } from '../../../mocks/filesManager';
import { parseMock, shpParserMock } from '../../../mocks/shpParser';
import { parseFilesShpJsonMock, mapMock, metadataMapperMock } from '../../../mocks/metadataMapperMock';

import { configMock } from '../../../mocks/config';
import { HistoryStatus } from '../../../../src/layerCreator/historyStatus';

const expectedMetadata = loadTestMetadata();
const baseHistoryStatus = {
  directory: 'test',
  status: HistoryStatus.IN_PROGRESS,
  id: expectedMetadata.id,
  version: expectedMetadata.version,
};
const triggeredHistoryStatus = { ...baseHistoryStatus, status: HistoryStatus.TRIGGERED };
const failedHistoryStatus = { ...baseHistoryStatus, status: HistoryStatus.FAILED };

describe('trigger', () => {
  afterEach(function () {
    jest.resetAllMocks();
    axiosMock.reset();
  });

  describe('#trigger', () => {
    it('Call overseer ingest Discrete Layer', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(undefined);
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);

      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('test');

      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledWith(expectedMetadata);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledWith('test', HistoryStatus.TRIGGERED, expectedMetadata.id, expectedMetadata.version);
    });

    it('auto trigger will skip already triggered directory', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(triggeredHistoryStatus);
      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('test');

      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(0);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(0);
    });

    it('auto trigger will skip already failed directory', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(failedHistoryStatus);
      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('test');

      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(0);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(0);
    });

    it('manual trigger will not skip already triggered directory', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(triggeredHistoryStatus);
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);

      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('test', true);

      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(2);
    });

    it('manual trigger will not skip already failed directory', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(failedHistoryStatus);
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);

      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('test', true);

      // expectation
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(2);
    });
  });
});

function loadTestMetadata(): LayerMetadata {
  const layerMetadataPath = resolve(__dirname, '../../../mockData/layerMetadata.json');
  const layerMetadataStr = readFileSync(layerMetadataPath, { encoding: 'utf8' });
  return (JSON.parse(layerMetadataStr) as unknown) as LayerMetadata;
}
