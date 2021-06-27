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
import { lockMock, isQueueEmptyMock } from '../../../mocks/limitingLock';

import { configMock, getMock } from '../../../mocks/config';
import { HistoryStatus } from '../../../../src/layerCreator/historyStatus';
import { fileMapperMock, stripSubDirsMock, getFilePathMock } from '../../../mocks/fileMapper';

const expectedMetadata = loadTestMetadata();
const expectedParams = loadTestIngestionParams();
const baseHistoryStatus = {
  directory: 'test',
  status: HistoryStatus.IN_PROGRESS,
  id: expectedMetadata.id,
  version: expectedMetadata.version,
};
const fileList = [
  'X1825_Y1649.Tiff',
  'X1825_Y1650.Tiff',
  'X1825_Y1651.Tiff',
  'X1826_Y1649.Tiff',
  'X1826_Y1650.Tiff',
  'X1826_Y1651.Tiff',
  'X1827_Y1649.Tiff',
  'X1827_Y1650.Tiff',
  'X1827_Y1651.Tiff',
  'X1828_Y1649.Tiff',
  'X1828_Y1650.Tiff',
  'X1828_Y1651.Tiff',
];
const triggeredHistoryStatus = { ...baseHistoryStatus, status: HistoryStatus.TRIGGERED };
const failedHistoryStatus = { ...baseHistoryStatus, status: HistoryStatus.FAILED };

let configData: { [key: string]: unknown } = {};

describe('trigger', () => {
  beforeEach(() => {
    configData['mountDir'] = '/mountDir';
    getMock.mockImplementation((key: string) => configData[key]);
    stripSubDirsMock.mockImplementation((dir: string) => dir);
    getFilePathMock.mockImplementation((file: string, extension: string) => `${file}.${extension}`);
  });

  afterEach(function () {
    jest.resetAllMocks();
    axiosMock.reset();
    configData = {};
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
      parseFilesShpJsonMock.mockReturnValue(fileList);
      mapMock.mockReturnValue(expectedMetadata);

      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        lockMock,
        fileMapperMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('/mountDir/test');

      // expectation
      expect(parseMock).toHaveBeenCalledTimes(3);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledWith(expectedParams);
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
        lockMock,
        fileMapperMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('/mountDir/test');

      // expectation
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(1);
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
        lockMock,
        fileMapperMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('/mountDir/test');

      // expectation
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(1);
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
        lockMock,
        fileMapperMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('/mountDir/test', true);

      // expectation
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(1);
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
        lockMock,
        fileMapperMock,
        { log: jest.fn() },
        configMock
      );

      // action
      await trigger.trigger('/mountDir/test', true);

      // expectation
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(1);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(2);
    });

    it('auto trigger will retry parsing invalid shp files if only one task is queued', async function () {
      // set mock values
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      getDiscreteStatusMock.mockResolvedValue(undefined);
      isQueueEmptyMock.mockReturnValue(true);
      parseMock.mockRejectedValue(new Error('tests'));
      configData['watcher.shpRetry'] = {
        retries: 4,
        factor: 2,
        minTimeout: 1,
        maxTimeout: 10,
        randomize: false,
      };

      const trigger = new Trigger(
        shpParserMock,
        filesManagerMock,
        metadataMapperMock,
        overseerClientMock,
        agentDbClientMock,
        lockMock,
        fileMapperMock,
        { log: jest.fn() },
        configMock
      );

      // action
      const action = async () => {
        await trigger.trigger('/mountDir/test');
      };

      // expectation
      await expect(action).rejects.toThrow();
      expect(parseMock).toHaveBeenCalledTimes(5);
    });
  });
});

function loadTestMetadata(): LayerMetadata {
  const layerMetadataPath = resolve(__dirname, '../../../mockData/layerMetadata.json');
  return loadJson(layerMetadataPath) as LayerMetadata;
}

function loadTestIngestionParams(): LayerMetadata {
  const layerMetadataPath = resolve(__dirname, '../../../mockData/ingestionParams.json');
  return loadJson(layerMetadataPath) as LayerMetadata;
}

function loadJson(path: string): unknown {
  const content = readFileSync(path, { encoding: 'utf8' });
  return JSON.parse(content) as unknown;
}
