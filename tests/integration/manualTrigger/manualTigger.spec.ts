import { normalize, join as joinPath } from 'path';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import { registerTestValues } from '../testContainerConfig';
import { fileExistsMock, readAllLinesMock } from '../../mocks/filesManager';
import { initShapeFileMock } from '../../mocks/shapeFile';
import { registerDefaultConfig } from '../../mocks/config';
import { init as initFs } from '../../mocks/fs/opendir';
import { tfw } from '../../mockData/tfw';
import { withoutTfw } from '../../mockData/fs';
import * as requestSender from './helpers/requestSender';

describe('manualTrigger', function () {
  const layerRootDir = normalize('/layerSources/testDir');
  const expectedShapes = [
    joinPath(layerRootDir, 'Shapes', 'Files.shp'),
    joinPath(layerRootDir, 'Shapes', 'Files.dbf'),
    joinPath(layerRootDir, 'Shapes', 'Product.shp'),
    joinPath(layerRootDir, 'Shapes', 'Product.dbf'),
    joinPath(layerRootDir, 'Shapes', 'ShapeMetadata.shp'),
    joinPath(layerRootDir, 'Shapes', 'ShapeMetadata.dbf'),
  ];
  const expectedTiffs = [
    normalize('tiff/X1881_Y1730.tif'),
    normalize('tiff/X1881_Y1731.tif'),
    normalize('tiff/X1881_Y1732.tif'),
    normalize('tiff/X1882_Y1730.tif'),
    normalize('tiff/X1882_Y1731.tif'),
    normalize('tiff/X1882_Y1732.tif'),
    normalize('tiff/X1883_Y1730.tif'),
    normalize('tiff/X1883_Y1731.tif'),
    normalize('tiff/X1883_Y1732.tif'),
  ];
  const expectedTfw = joinPath(layerRootDir, 'tiff', 'X1881_Y1730.tfw');

  beforeAll(function () {
    container.clearInstances();
    registerTestValues();
    requestSender.init();
  });
  beforeEach(() => {
    initShapeFileMock();
    registerDefaultConfig();
  });
  afterEach(function () {
    jest.resetAllMocks();
    axiosMock.reset();
  });

  describe('Happy Path', function () {
    it('should return 200 status code when triggered on layer root dir', async function () {
      axiosMock.post.mockResolvedValue({});
      fileExistsMock.mockResolvedValue(true);
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(fileExistsMock).toHaveBeenCalledWith(expectedTfw);
      expect(readAllLinesMock).toHaveBeenCalledWith(expectedTfw);
    });

    it('should return 200 status code when triggered on layer Shapes dir', async function () {
      axiosMock.post.mockResolvedValue({});
      fileExistsMock.mockResolvedValue(true);
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir/Shapes',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(fileExistsMock).toHaveBeenCalledWith(expectedTfw);
      expect(readAllLinesMock).toHaveBeenCalledWith(expectedTfw);
    });

    it('should return 200 status code when triggered on layer tiff dir', async function () {
      axiosMock.post.mockResolvedValue({});
      fileExistsMock.mockResolvedValue(true);
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir/tiff',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(fileExistsMock).toHaveBeenCalledWith(expectedTfw);
      expect(readAllLinesMock).toHaveBeenCalledWith(expectedTfw);
    });
  });

  describe('Bad Path', function () {
    // All requests with status code of 400
    it('should return 400 status code', async function () {
      const invalidRequest = {
        directory: 'testDir',
      };

      const response = await requestSender.createLayer(invalidRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when tiff files are missing', async () => {
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when shp files are missing', async () => {
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it.only('should return 400 when first tfw file are missing', async () => {
      initFs(withoutTfw);
      axiosMock.post.mockResolvedValue({});
      fileExistsMock.mockResolvedValue(false);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
