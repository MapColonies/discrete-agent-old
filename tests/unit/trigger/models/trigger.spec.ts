import axiosMock from 'jest-mock-axios';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { Trigger } from '../../../../src/layerCreator/models/trigger';
import { HistoryStatus } from '../../../../src/layerCreator/historyStatus';
import { overseerClientMock, ingestDiscreteLayerMock } from '../../../mocks/clients/overseerClient';
import { agentDbClientMock, updateDiscreteStatusMock, getDiscreteStatusMock } from '../../../mocks/clients/agentDbClient';
import { filesManagerMock, fileExistsMock, readAllLinesMock, directoryExistsMock } from '../../../mocks/filesManager';
import { parseMock, shpParserMock } from '../../../mocks/shpParser';
import { parseFilesShpJsonMock, mapMock, metadataMapperMock } from '../../../mocks/metadataMapperMock';
import { lockMock, isQueueEmptyMock } from '../../../mocks/limitingLock';
import { configMock, getMock } from '../../../mocks/config';
import {
  fileMapperMock,
  getFilePathMock,
  getRootDirMock,
  findFilesRelativePathsMock,
  getFileFullPathMock,
  cleanRelativePathMock,
} from '../../../mocks/fileMapper';
import { tfw } from '../../../mockData/tfw';
import { metadata } from '../../../mockData/layerMetadata';
import { ingestionParams } from '../../../mockData/ingestionParams';
import { NotFoundError } from '../../../../src/common/exceptions/http/notFoundError';

const expectedMetadata = loadTestMetadata();
const expectedParams = loadTestIngestionParams();
const baseHistoryStatus = {
  directory: 'test',
  status: HistoryStatus.IN_PROGRESS,
  id: expectedMetadata.productId,
  version: expectedMetadata.productVersion,
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
const shpFiles = ['Files.shp', 'Files.dbf', 'Product.shp', 'Product.dbf', 'ShapeMetadata.shp', 'ShapeMetadata.dbf'];
const triggeredHistoryStatus = { ...baseHistoryStatus, status: HistoryStatus.TRIGGERED };
const failedHistoryStatus = { ...baseHistoryStatus, status: HistoryStatus.FAILED };

let configData: { [key: string]: unknown } = {};

describe('trigger', () => {
  beforeEach(() => {
    configData['mountDir'] = '/mountDir';
    getMock.mockImplementation((key: string) => configData[key]);
    getFilePathMock.mockImplementation((file: string, extension: string) => `${file}.${extension}`);
    readAllLinesMock.mockResolvedValue(tfw);
    directoryExistsMock.mockReturnValue(true);
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
      parseFilesShpJsonMock.mockReturnValue(fileList);
      mapMock.mockReturnValue(expectedMetadata);
      fileExistsMock.mockResolvedValue(true);
      getRootDirMock.mockReturnValue('/layerSources/test');
      findFilesRelativePathsMock.mockResolvedValueOnce(shpFiles).mockResolvedValueOnce(fileList);
      getFileFullPathMock.mockResolvedValueOnce('file.tfw');
      cleanRelativePathMock.mockReturnValueOnce('test');

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
      expect(updateDiscreteStatusMock).toHaveBeenCalledWith(
        'test',
        HistoryStatus.TRIGGERED,
        expectedMetadata.productId,
        expectedMetadata.productVersion
      );
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
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);
      fileExistsMock.mockResolvedValue(true);
      findFilesRelativePathsMock.mockResolvedValueOnce(shpFiles).mockResolvedValueOnce(['file.tiff']);
      getFileFullPathMock.mockResolvedValueOnce('file.tfw');
      getRootDirMock.mockReturnValue('/mountDir/test');

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
      await trigger.trigger('test', true);

      // expectation
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(1);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(2);
    });

    it('manual trigger will not skip already failed directory', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(failedHistoryStatus);
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);
      fileExistsMock.mockResolvedValue(true);
      findFilesRelativePathsMock.mockResolvedValueOnce(shpFiles).mockResolvedValueOnce(['file.tiff']);
      getFileFullPathMock.mockResolvedValueOnce('file.tfw');
      getRootDirMock.mockReturnValue('/mountDir/test');
      cleanRelativePathMock.mockResolvedValue('test');

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
      await trigger.trigger('/test', true);

      // expectation
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(1);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(1);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(2);
    });

    it('auto trigger will retry parsing invalid shp files if only one task is queued', async function () {
      // set mock values
      getDiscreteStatusMock.mockResolvedValue(undefined);
      isQueueEmptyMock.mockReturnValue(true);
      parseMock.mockRejectedValue(new Error('tests'));
      findFilesRelativePathsMock.mockResolvedValue(shpFiles);
      getRootDirMock.mockReturnValue('/mountDir/test');

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
        await trigger.trigger('test');
      };

      // expectation
      await expect(action).rejects.toThrow();
      expect(parseMock).toHaveBeenCalledTimes(5);
    });

    it('unit test: trigger will not work on invalid directory', async function () {
      // set mock values
      directoryExistsMock.mockReturnValue(false);

      getDiscreteStatusMock.mockResolvedValue(triggeredHistoryStatus);
      axiosMock.post.mockResolvedValue({});
      ingestDiscreteLayerMock.mockResolvedValue({});
      updateDiscreteStatusMock.mockResolvedValue({});
      parseMock.mockResolvedValue({});
      parseFilesShpJsonMock.mockReturnValue(['file.tiff']);
      mapMock.mockReturnValue(expectedMetadata);
      fileExistsMock.mockResolvedValue(true);
      findFilesRelativePathsMock.mockResolvedValueOnce(shpFiles).mockResolvedValueOnce(['file.tiff']);
      getFileFullPathMock.mockResolvedValueOnce('file.tfw');
      getRootDirMock.mockReturnValue('/mountDir/test');

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
      const response = trigger.trigger('test', true);

      // expectation
      await expect(response).rejects.toThrow(NotFoundError);
      expect(getDiscreteStatusMock).toHaveBeenCalledTimes(0);
      expect(ingestDiscreteLayerMock).toHaveBeenCalledTimes(0);
      expect(updateDiscreteStatusMock).toHaveBeenCalledTimes(0);
    });
  });
});

function loadTestMetadata(): LayerMetadata {
  return { ...metadata } as unknown as LayerMetadata;
}

function loadTestIngestionParams(): LayerMetadata {
  return { ...ingestionParams } as unknown as LayerMetadata;
}
