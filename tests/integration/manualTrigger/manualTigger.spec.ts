import { normalize, join as joinPath } from 'path';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import { registerTestValues } from '../testContainerConfig';
import { validateLayerFilesExistsMock, validateShpFilesExistsMock } from '../../mocks/filesManager';
import { initShapeFileMock } from '../../mocks/shapeFile';
import { registerDefaultConfig } from '../../mocks/config';
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
    normalize('tiff/X1825_Y1649.tif'),
    normalize('tiff/X1825_Y1650.tif'),
    normalize('tiff/X1825_Y1651.tif'),
    normalize('tiff/X1826_Y1649.tif'),
    normalize('tiff/X1826_Y1650.tif'),
    normalize('tiff/X1826_Y1651.tif'),
    normalize('tiff/X1827_Y1649.tif'),
    normalize('tiff/X1827_Y1650.tif'),
    normalize('tiff/X1827_Y1651.tif'),
    normalize('tiff/X1828_Y1649.tif'),
    normalize('tiff/X1828_Y1650.tif'),
    normalize('tiff/X1828_Y1651.tif'),
  ];

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
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(validateShpFilesExistsMock).toHaveBeenCalledWith(...expectedShapes);
      expect(validateLayerFilesExistsMock).toHaveBeenCalledWith(layerRootDir, expectedTiffs);
    });

    it('should return 200 status code when triggered on layer Shapes dir', async function () {
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir/Shapes',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(validateShpFilesExistsMock).toHaveBeenCalledWith(...expectedShapes);
      expect(validateLayerFilesExistsMock).toHaveBeenCalledWith(layerRootDir, expectedTiffs);
    });

    it('should return 200 status code when triggered on layer tiff dir', async function () {
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir/tiff',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(validateShpFilesExistsMock).toHaveBeenCalledWith(...expectedShapes);
      expect(validateLayerFilesExistsMock).toHaveBeenCalledWith(layerRootDir, expectedTiffs);
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
      validateLayerFilesExistsMock.mockResolvedValue(false);
      validateShpFilesExistsMock.mockResolvedValue(true);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when shp files are missing', async () => {
      validateLayerFilesExistsMock.mockResolvedValue(true);
      validateShpFilesExistsMock.mockResolvedValue(false);
      axiosMock.post.mockResolvedValue({});
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
